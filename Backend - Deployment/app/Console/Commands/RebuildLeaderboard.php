<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\LeaderboardService;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class RebuildLeaderboard extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leaderboard:rebuild';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rebuild Redis leaderboards from MySQL source of truth';

    protected $leaderboard;

    public function __construct(LeaderboardService $leaderboard)
    {
        parent::__construct();
        $this->leaderboard = $leaderboard;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting leaderboard rebuild...');
        $start = microtime(true);

        $this->rebuildGlobal();
        $this->rebuildPerExam();
        $this->rebuildPerClass();

        $duration = round(microtime(true) - $start, 2);
        $this->info("Leaderboard rebuild completed in {$duration} seconds.");
    }

    protected function rebuildGlobal()
    {
        $this->info('Rebuilding global leaderboard...');
        $key = $this->leaderboard->buildKey('global');
        $tmpKey = "{$key}:tmp";

        $results = DB::table('exam_analytics')
            ->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
            ->where('exam_attempts.status', 'completed')
            ->select('exam_analytics.user_id')
            ->selectRaw('MAX((overall_score * 10000000000) + (9999999999 - UNIX_TIMESTAMP(exam_attempts.completed_at))) as best_composite')
            ->groupBy('exam_analytics.user_id')
            ->get();

        if ($results->isEmpty()) {
            return;
        }

        try {
            // Clear temp key first
            Redis::del($tmpKey);

            foreach ($results as $row) {
                Redis::zadd($tmpKey, $row->best_composite, $row->user_id);
            }

            Redis::rename($tmpKey, $key);
            $this->info("Successfully rebuilt global leaderboard.");
        } catch (\Exception $e) {
            $this->error("Failed to rebuild global leaderboard: " . $e->getMessage());
            \Illuminate\Support\Facades\Log::error("Leaderboard Rebuild Error (Global): " . $e->getMessage());
        }
    }

    protected function rebuildPerExam()
    {
        $this->info('Rebuilding per-exam leaderboards...');
        
        $exams = DB::table('exam_attempts')
            ->where('status', 'completed')
            ->distinct()
            ->pluck('exam_id');

        foreach ($exams as $examId) {
            $key = $this->leaderboard->buildKey('exam', $examId);
            $tmpKey = "{$key}:tmp";

            $results = DB::table('exam_analytics')
                ->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
                ->where('exam_attempts.status', 'completed')
                ->where('exam_attempts.exam_id', $examId)
                ->select('exam_analytics.user_id')
                ->selectRaw('MAX((overall_score * 10000000000) + (9999999999 - UNIX_TIMESTAMP(exam_attempts.completed_at))) as best_composite')
                ->groupBy('exam_analytics.user_id')
                ->get();

            if ($results->isNotEmpty()) {
                try {
                    Redis::del($tmpKey);
                    foreach ($results as $row) {
                        Redis::zadd($tmpKey, $row->best_composite, $row->user_id);
                    }
                    Redis::expire($tmpKey, 604800); // 7 days TTL
                    Redis::rename($tmpKey, $key);
                    $this->line("Rebuilt exam #{$examId}");
                } catch (\Exception $e) {
                    $this->error("Failed rebuild for exam #{$examId}: " . $e->getMessage());
                    \Illuminate\Support\Facades\Log::error("Leaderboard Rebuild Error (Exam #{$examId}): " . $e->getMessage());
                }
            }
        }
    }

    protected function rebuildPerClass()
    {
        $this->info('Rebuilding per-class leaderboards...');

        $classes = DB::table('class_enrollments')
            ->distinct()
            ->pluck('classID');

        foreach ($classes as $classId) {
            $key = $this->leaderboard->buildKey('class', $classId);
            $tmpKey = "{$key}:tmp";

            $results = DB::table('exam_analytics')
                ->join('exam_attempts', 'exam_analytics.attempt_id', '=', 'exam_attempts.id')
                ->join('class_enrollments', 'exam_analytics.user_id', '=', 'class_enrollments.studentID')
                ->where('exam_attempts.status', 'completed')
                ->where('class_enrollments.classID', $classId)
                ->select('exam_analytics.user_id')
                ->selectRaw('MAX((overall_score * 1000000) + (9999999999 - UNIX_TIMESTAMP(exam_attempts.completed_at))) as best_composite')
                ->groupBy('exam_analytics.user_id')
                ->get();

            if ($results->isNotEmpty()) {
                try {
                    Redis::del($tmpKey);
                    foreach ($results as $row) {
                        Redis::zadd($tmpKey, $row->best_composite, $row->user_id);
                    }
                    Redis::expire($tmpKey, 2592000); // 30 days TTL
                    Redis::rename($tmpKey, $key);
                    $this->line("Rebuilt class #{$classId}");
                } catch (\Exception $e) {
                    $this->error("Failed rebuild for class #{$classId}: " . $e->getMessage());
                    \Illuminate\Support\Facades\Log::error("Leaderboard Rebuild Error (Class #{$classId}): " . $e->getMessage());
                }
            }
        }
    }
}
