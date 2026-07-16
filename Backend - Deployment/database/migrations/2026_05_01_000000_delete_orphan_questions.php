<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Deletes 10,373,500 orphaned questions (created_at IS NULL) in chunks
     * to avoid table locks. Cascade deletes will also clean up choices.
     */
    public function up(): void
    {
        $chunkSize = 10000;
        $deleted = 0;
        $totalStart = microtime(true);

        // Disable FK checks temporarily for faster deletion
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        Log::info("Starting orphan question deletion in chunks of {$chunkSize}...");
        echo "Starting orphan question deletion...\n";

        do {
            $startTime = microtime(true);

            $count = DB::table('questions')
                ->whereNull('created_at')
                ->limit($chunkSize)
                ->delete();

            $deleted += $count;
            $elapsed = round(microtime(true) - $startTime, 2);
            $totalElapsed = round(microtime(true) - $totalStart, 1);

            if ($count > 0) {
                $msg = "  Deleted {$count} (total: {$deleted}) — chunk took {$elapsed}s, overall: {$totalElapsed}s";
                Log::info("M0: {$msg}");
                echo "{$msg}\n";

                // Throttle to avoid overwhelming MySQL
                sleep(1);
            }
        } while ($count > 0);

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');

        $totalTime = round(microtime(true) - $totalStart, 1);
        $msg = "Cleanup complete: {$deleted} orphan questions deleted in {$totalTime}s";
        Log::info("M0: {$msg}");
        echo "{$msg}\n";
    }

    /**
     * Reverse the migrations (no-op — deleted data cannot be recovered).
     */
    public function down(): void
    {
        echo "This migration cannot be reversed. Restore from backup if needed.\n";
    }
};