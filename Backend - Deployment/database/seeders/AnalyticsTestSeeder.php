<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnalyticsTestSeeder extends Seeder
{
    public function run(): void
    {
        // Find 3 real student users (roleID = 1) — don't hardcode IDs
        $students = DB::table('users')
            ->where('roleID', 1)
            ->select('userID', 'firstName', 'lastName')
            ->limit(3)
            ->get();

        if ($students->count() < 3) {
            $this->command->warn('Not enough student users found. Skipping analytics test data.');
            return;
        }

        $userIds = $students->pluck('userID')->toArray();

        // Get reference data
        $subjectId  = DB::table('subjects')->value('subjectID') ?? 1;
        $topicIds   = DB::table('coverages')->pluck('id')->toArray();
        $topicNames = DB::table('coverages')->pluck('name', 'id')->toArray();
        $questionIds = DB::table('questions')
            ->where('subjectID', $subjectId)
            ->pluck('questionID')
            ->take(20)
            ->toArray();

        if (empty($questionIds)) {
            $questionIds = DB::table('questions')->pluck('questionID')->take(20)->toArray();
        }

        // Ensure an exam exists
        $examId = DB::table('exams')->value('id');
        if (!$examId) {
            $examId = DB::table('exams')->insertGetId([
                'title'         => 'Analytics Demo Exam',
                'subject_id'    => $subjectId,
                'total_items'   => 10,
                'passing_score' => 7,
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        // ── Clean old test data ─────────────────────────────────────────────
        $existingAttemptIds = DB::table('exam_attempts')
            ->whereIn('user_id', $userIds)
            ->pluck('id')
            ->toArray();

        if (!empty($existingAttemptIds)) {
            DB::table('exam_results')->whereIn('attempt_id', $existingAttemptIds)->delete();
            DB::table('exam_analytics')->whereIn('attempt_id', $existingAttemptIds)->delete();
            DB::table('exam_topic_analytics')->whereIn('attempt_id', $existingAttemptIds)->delete();
            DB::table('exam_difficulty_analytics')->whereIn('attempt_id', $existingAttemptIds)->delete();
            DB::table('exam_recommendations')->whereIn('attempt_id', $existingAttemptIds)->delete();
        }
        DB::table('exam_attempts')->whereIn('user_id', $userIds)->delete();
        DB::table('lesson_views')->whereIn('user_id', $userIds)->delete();
        DB::table('question_stats_daily')->whereDate('stat_date', today())->delete();

        $this->command->info('🧹 Old analytics test data cleaned.');

        // Score progression per student (3 attempts each: early → mid → recent)
        $userScores = [
            $userIds[0] => [4, 6, 8],
            $userIds[1] => [7, 7, 9],
            $userIds[2] => [3, 4, 5],
        ];

        $difficulties = ['easy', 'moderate', 'hard'];

        foreach ($students as $idx => $user) {
            $userId     = $user->userID;
            $name       = trim($user->firstName . ' ' . $user->lastName) ?: "Student {$userId}";
            $scores     = $userScores[$userId];

            $this->command->info("📝 Seeding {$name} (userID: {$userId})...");

            // Insert 3 attempts with proper attempt_number (1, 2, 3)
            $attemptDates = [
                ['start' => now()->subDays(10), 'finish' => now()->subDays(10)],
                ['start' => now()->subDays(5),  'finish' => now()->subDays(5)],
                ['start' => now(),              'finish' => now()],
            ];

            foreach ($attemptDates as $attemptNo => $date) {
                $attemptId = DB::table('exam_attempts')->insertGetId([
                    'user_id'        => $userId,
                    'exam_id'        => $examId,
                    'attempt_number' => $attemptNo + 1,
                    'started_at'     => $date['start'],
                    'finished_at'    => $date['finish'],
                    'status'         => 'completed',
                    'created_at'     => $date['start'],
                    'updated_at'     => $date['finish'],
                ]);

                $correctCount = $scores[$attemptNo];
                $totalQ       = 10;

                // ── exam_results ──────────────────────────────────────────
                for ($q = 0; $q < $totalQ; $q++) {
                    $difficulty = $difficulties[$q % 3];
                    $topicId    = $topicIds[$q % count($topicIds)];
                    $questionId = $questionIds[$q % count($questionIds)];
                    $isCorrect  = ($q + 1) <= $correctCount;

                    DB::table('exam_results')->insert([
                        'attempt_id'    => $attemptId,
                        'question_id'   => $questionId,
                        'topic_id'      => $topicId,
                        'subject_id'    => $subjectId,
                        'difficulty_id' => $difficultyIds[$difficulty] ?? null,
                        'is_correct'    => $isCorrect,
                        'is_skipped'    => false,
                        'time_spent'    => rand(20, 120),
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ]);
                }

                // ── exam_analytics ────────────────────────────────────────
                $pct = round(($correctCount / $totalQ) * 100, 2);

                // Compute improvement vs first attempt
                $improvementPct = null;
                if ($attemptNo > 0) {
                    $firstScore = $scores[0];
                    if ($firstScore > 0) {
                        $improvementPct = round((($pct - ($firstScore / $totalQ * 100)) / ($firstScore / $totalQ * 100)) * 100, 2);
                    }
                }

                DB::table('exam_analytics')->insert([
                    'attempt_id'       => $attemptId,
                    'user_id'          => $userId,
                    'overall_score'    => $pct,
                    'rank'             => null,
                    'total_candidates' => count($userIds),
                    'percentile'       => round(($userId / max($userIds)) * 100, 2),
                    'improvement_pct'  => $improvementPct,
                    'has_weak_topics'  => $pct < 60,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);

                // ── exam_topic_analytics ──────────────────────────────────
                foreach ($topicIds as $tid) {
                    $topicTotal   = 0;
                    $topicCorrect = 0;
                    for ($q = 0; $q < $totalQ; $q++) {
                        if ($topicIds[$q % count($topicIds)] == $tid) {
                            $topicTotal++;
                            if (($q + 1) <= $correctCount) {
                                $topicCorrect++;
                            }
                        }
                    }
                    $topicScore = $topicTotal > 0 ? round(($topicCorrect / $topicTotal) * 100, 2) : 0;

                    DB::table('exam_topic_analytics')->insert([
                        'attempt_id' => $attemptId,
                        'user_id'    => $userId,
                        'topic_id'   => $tid,
                        'subject_id' => $subjectId,
                        'correct'    => $topicCorrect,
                        'total'      => $topicTotal,
                        'score_pct'  => $topicScore,
                        'is_weak'    => $topicScore < 60,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // ── exam_difficulty_analytics ─────────────────────────────
                foreach ($difficulties as $diff) {
                    $diffTotal   = 0;
                    $diffCorrect = 0;
                    for ($q = 0; $q < $totalQ; $q++) {
                        if ($difficulties[$q % 3] === $diff) {
                            $diffTotal++;
                            if (($q + 1) <= $correctCount) {
                                $diffCorrect++;
                            }
                        }
                    }
                    $diffScore = $diffTotal > 0 ? round(($diffCorrect / $diffTotal) * 100, 2) : 0;

                    DB::table('exam_difficulty_analytics')->insert([
                        'attempt_id' => $attemptId,
                        'user_id'    => $userId,
                        'difficulty' => $diff,
                        'correct'    => $diffCorrect,
                        'total'      => $diffTotal,
                        'score_pct'  => $diffScore,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // ── exam_recommendations ──────────────────────────────────
                if ($pct < 60) {
                    DB::table('exam_recommendations')->insert([
                        'attempt_id'     => $attemptId,
                        'user_id'        => $userId,
                        'recommendation' => 'Review your overall performance and revisit all weak areas.',
                        'type'           => 'general',
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]);
                }
                // Add topic-specific recommendations for weak topics
                foreach ($topicIds as $tid) {
                    // Check if this topic is weak
                    $topicRows = DB::table('exam_topic_analytics')
                        ->where('attempt_id', $attemptId)
                        ->where('topic_id', $tid)
                        ->where('is_weak', true)
                        ->get();
                    foreach ($topicRows as $wt) {
                        DB::table('exam_recommendations')->insert([
                            'attempt_id'     => $attemptId,
                            'user_id'        => $userId,
                            'recommendation' => 'Practice more in ' . ($topicNames[$tid] ?? "Topic {$tid}") . '.',
                            'type'           => 'topic',
                            'created_at'     => now(),
                            'updated_at'     => now(),
                        ]);
                    }
                }
            }
        }

        // ── lesson_views ──────────────────────────────────────────────────
        $lessonIds = DB::table('lessons')->pluck('id')->toArray();
        if (empty($lessonIds)) {
            $lessonIds = range(1, 5);
        }

        foreach ($userIds as $userId) {
            foreach ($lessonIds as $lessonId) {
                DB::table('lesson_views')->insert([
                    'user_id'    => $userId,
                    'lesson_id'  => $lessonId,
                    'course_id'  => null,
                    'subject_id' => $subjectId,
                    'created_at' => now()->subDays(rand(1, 14)),
                    'updated_at' => now(),
                ]);
            }
        }

        // ── question_stats_daily ──────────────────────────────────────────
        for ($q = 0; $q < 10; $q++) {
            $questionId = $questionIds[$q % count($questionIds)];
            $topicId    = $topicIds[$q % count($topicIds)];
            $total      = rand(10, 50);
            $correct    = rand(3, $total - 2);
            $incorrect  = rand(1, $total - $correct - 1);
            $skipped    = max(0, $total - $correct - $incorrect);

            DB::table('question_stats_daily')->insert([
                'question_id'     => $questionId,
                'topic_id'        => $topicId,
                'stat_date'       => now()->toDateString(),
                'total_attempts'  => $total,
                'total_correct'   => $correct,
                'total_incorrect' => $incorrect,
                'total_skipped'   => $skipped,
                'error_rate'      => $total > 0 ? round($incorrect / $total, 4) : 0,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $this->command->info('');
        $this->command->info('✅ Analytics test data seeded!');
        $this->command->info("   Students     : {$students->count()}");
        $this->command->info("   Attempts     : " . ($students->count() * 3) . " (3 per student, attempt_number 1-3)");
        $this->command->info("   Exam results : " . ($students->count() * 3 * 10));
        $this->command->info("   Exam analytics : " . ($students->count() * 3));
        $this->command->info("   Topic analytics: " . ($students->count() * 3 * count($topicIds)));
        $this->command->info("   Difficulty analytics: " . ($students->count() * 3 * 3));
        $this->command->info("   Lesson views   : " . ($students->count() * count($lessonIds)));
        $this->command->info("   Question stats : 10 rows");
    }
}
