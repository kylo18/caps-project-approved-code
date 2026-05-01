<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeleteOrphanQuestionsCommand extends Command
{
    protected $signature = 'data:delete-orphan-questions
                            {--chunk=10000 : Rows per chunk}
                            {--dry-run : Preview only, no deletions}';

    protected $description = 'Delete orphaned questions (created_at IS NULL) in chunks';

    public function handle(): int
    {
        $chunkSize = (int) $this->option('chunk');
        $dryRun = $this->option('dry-run');

        $orphanCount = DB::table('questions')->whereNull('created_at')->count();
        $this->info("Found {$orphanCount} orphan questions to delete.");

        if ($dryRun) {
            $this->warn('DRY RUN — no rows deleted.');
            return 0;
        }

        if ($orphanCount === 0) {
            $this->info('No orphan questions found.');
            return 0;
        }

        if (!$this->confirm("Delete {$orphanCount} questions in chunks of {$chunkSize}? This cannot be undone.")) {
            return 1;
        }

        $deleted = 0;
        $totalStart = microtime(true);

        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $bar = $this->output->createProgressBar($orphanCount);
        $bar->start();

        do {
            $count = DB::table('questions')
                ->whereNull('created_at')
                ->limit($chunkSize)
                ->delete();

            $deleted += $count;
            $bar->advance($count);

            if ($count > 0) {
                sleep(1);
            }
        } while ($count > 0);

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        $bar->finish();

        $this->newLine();
        $this->info("Done! Deleted {$deleted} orphan questions in " . round(microtime(true) - $totalStart, 1) . "s");
        Log::info("DeleteOrphanQuestionsCommand: Deleted {$deleted} orphan questions");

        return 0;
    }
}