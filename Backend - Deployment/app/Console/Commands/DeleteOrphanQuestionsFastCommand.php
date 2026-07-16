<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeleteOrphanQuestionsFastCommand extends Command
{
    protected $signature = 'data:delete-orphan-questions-fast
                            {--chunk=50000 : Rows per batch}
                            {--dry-run : Preview only}';

    protected $description = 'Fast deletion of orphan questions using direct SQL (no Eloquent/ORM overhead)';

    public function handle(): int
    {
        $chunkSize = (int) $this->option('chunk');
        $dryRun = $this->option('dry-run');

        $orphanCount = DB::selectOne(
            "SELECT COUNT(*) as cnt FROM questions WHERE created_at IS NULL"
        )->cnt ?? 0;

        $this->info("Found " . number_format($orphanCount) . " orphan questions.");
        $this->warn("This will permanently delete these rows and cascade to choices + analytics tables.");
        $this->warn("Estimated time: " . round($orphanCount / $chunkSize * 2 / 60, 1) . " minutes");

        if ($dryRun) {
            $this->warn("DRY RUN — no changes made.");
            return 0;
        }

        if ($orphanCount === 0) {
            $this->info("No orphan questions to delete.");
            return 0;
        }

        if (!$this->confirm("Proceed with fast deletion of " . number_format($orphanCount) . " rows?")) {
            return 1;
        }

        $startTime = microtime(true);

        // Step 1: Get IDs of orphan questions
        $this->info("Fetching orphan question IDs...");
        $orphanIds = collect(DB::select(
            "SELECT questionID FROM questions WHERE created_at IS NULL LIMIT ?",
            [$chunkSize]
        ))->pluck('questionID')->toArray();

        if (empty($orphanIds)) {
            $this->info("No more orphan questions.");
            return 0;
        }

        $deleted = 0;
        $bar = $this->output->createProgressBar($orphanCount);
        $bar->start();

        // Step 2: Delete from child tables in batches (with FK checks disabled)
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $this->info("Deleting in batches of {$chunkSize}...");

        while (!empty($orphanIds)) {
            $idList = implode(',', $orphanIds);
            $chunkStart = microtime(true);

            // Delete from each child table
            $tables = [
                'choices' => 'questionID',
                'content_analytics' => 'question_id',
                'exam_results' => 'question_id',
                'learning_difficulty_analytics' => 'question_id',
                'personal_quiz_questions' => 'questionID',
                'practice_exam_answers' => 'question_id',
                'question_stats_daily' => 'question_id',
                'student_quiz_attempt_answers' => 'bank_question_id',
            ];

            foreach ($tables as $table => $col) {
                DB::statement("DELETE FROM {$table} WHERE {$col} IN ({$idList})");
            }

            // Delete from questions table
            DB::statement("DELETE FROM questions WHERE questionID IN ({$idList})");

            $deleted += count($orphanIds);
            $bar->advance(count($orphanIds));
            $chunkTime = round(microtime(true) - $chunkStart, 1);

            $this->info("  Batch {$chunkSize} deleted in {$chunkTime}s (total: " . number_format($deleted) . ")");

            // Get next batch
            $orphanIds = collect(DB::select(
                "SELECT questionID FROM questions WHERE created_at IS NULL LIMIT ?",
                [$chunkSize]
            ))->pluck('questionID')->toArray();

            // Small throttle between batches
            if (!empty($orphanIds)) usleep(500000); // 0.5s
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        $bar->finish();

        $totalTime = round(microtime(true) - $startTime, 1);
        $this->newLine();
        $this->info("Done! Deleted " . number_format($deleted) . " orphan questions in {$totalTime}s");
        Log::info("DeleteOrphanQuestionsFastCommand: Deleted {$deleted} orphan questions in {$totalTime}s");

        return 0;
    }
}