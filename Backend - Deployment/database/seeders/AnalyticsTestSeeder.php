<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnalyticsTestSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['id' => 11, 'name' => 'CE Student'],
            ['id' => 12, 'name' => 'CPE Student'],
            ['id' => 13, 'name' => 'EE Student'],
        ];

        $userIds = [11, 12, 13];

        // Get real IDs from DB
        $subjectId = DB::table('subjects')->value('subjectID') ?? 1;
        $topicIds  = DB::table('coverages')->pluck('id')->toArray();
        $questionIds = DB::table('questions')->pluck('questionID')->take(10)->toArray();

        DB::table('exam_results')->whereIn('attempt_id', function($q) use ($userIds) {
            $q->select('id')->from('exam_attempts')->whereIn('user_id', $userIds);
        })->delete();
        DB::table('exam_analytics')->whereIn('attempt_id', function($q) use ($userIds) {
            $q->select('id')->from('exam_attempts')->whereIn('user_id', $userIds);
        })->delete();
        DB::table('exam_topic_analytics')->whereIn('attempt_id', function($q) use ($userIds) {
            $q->select('id')->from('exam_attempts')->whereIn('user_id', $userIds);
        })->delete();
        DB::table('exam_difficulty_analytics')->whereIn('attempt_id', function($q) use ($userIds) {
            $q->select('id')->from('exam_attempts')->whereIn('user_id', $userIds);
        })->delete();
        DB::table('exam_recommendations')->whereIn('attempt_id', function($q) use ($userIds) {
            $q->select('id')->from('exam_attempts')->whereIn('user_id', $userIds);
        })->delete();
        DB::table('exam_attempts')->whereIn('user_id', $userIds)->delete();
        DB::table('lesson_views')->whereIn('user_id', $userIds)->delete();
        DB::table('question_stats_daily')->whereDate('stat_date', today())->delete();

        $this->command->info('?? Old test data cleaned.');

        $userScores = [
            11 => [4, 6, 8],
            12 => [7, 7, 8],
            13 => [3, 4, 5],
        ];

        $difficulties = ['easy', 'moderate', 'hard'];

        foreach ($users as $user) {
            $userId  = $user['id'];
            $name    = $user['name'];
            $scores  = $userScores[$userId];

            $this->command->info("Seeding {$name} (userID: {$userId})...");

            DB::table('exam_attempts')->insert([
                [
                    'user_id'     => $userId,
                    'exam_id'     => 1,
                    'started_at'  => now()->subDays(10),
                    'finished_at' => now()->subDays(10),
                    'status'      => 'completed',
                    'created_at'  => now()->subDays(10),
                    'updated_at'  => now()->subDays(10),
                ],
                [
                    'user_id'     => $userId,
                    'exam_id'     => 1,
                    'started_at'  => now()->subDays(5),
                    'finished_at' => now()->subDays(5),
                    'status'      => 'completed',
                    'created_at'  => now()->subDays(5),
                    'updated_at'  => now()->subDays(5),
                ],
                [
                    'user_id'     => $userId,
                    'exam_id'     => 1,
                    'started_at'  => now(),
                    'finished_at' => now(),
                    'status'      => 'completed',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ],
            ]);

            $attemptIds = DB::table('exam_attempts')
                ->where('user_id', $userId)
                ->orderBy('id', 'asc')
                ->pluck('id')
                ->toArray();

            $this->command->info("   Attempt IDs: " . implode(', ', $attemptIds));

            foreach ($attemptIds as $index => $attemptId) {
                $correctCount = $scores[$index];

                for ($q = 0; $q < 10; $q++) {
                    $difficulty  = $difficulties[$q % 3];
                    $topicId     = $topicIds[$q % count($topicIds)];
                    $questionId  = $questionIds[$q % count($questionIds)];
                    $isCorrect   = ($q + 1) <= $correctCount;

                    DB::table('exam_results')->insert([
                        'attempt_id'  => $attemptId,
                        'question_id' => $questionId,
                        'topic_id'    => $topicId,
                        'subject_id'  => $subjectId,
                        'difficulty'  => $difficulty,
                        'is_correct'  => $isCorrect,
                        'is_skipped'  => false,
                        'time_spent'  => rand(20, 120),
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }

        foreach ($userIds as $userId) {
            for ($i = 1; $i <= 5; $i++) {
                DB::table('lesson_views')->insert([
                    'user_id'    => $userId,
                    'lesson_id'  => $i,
                    'course_id'  => 1,
                    'subject_id' => $subjectId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        for ($q = 0; $q < 5; $q++) {
            $questionId = $questionIds[$q % count($questionIds)];
            $topicId    = $topicIds[$q % count($topicIds)];
            $total      = rand(10, 50);
            $correct    = rand(3, $total - 2);
            $incorrect  = rand(1, $total - $correct - 1);
            $skipped    = $total - $correct - $incorrect;

            DB::table('question_stats_daily')->insert([
                'question_id'     => $questionId,
                'topic_id'        => $topicId,
                'stat_date'       => now()->toDateString(),
                'total_attempts'  => $total,
                'total_correct'   => $correct,
                'total_incorrect' => $incorrect,
                'total_skipped'   => $skipped,
                'error_rate'      => round($incorrect / $total, 4),
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $this->command->info('');
        $this->command->info('? Analytics test data seeded!');
        $this->command->info('   CE  Student (11) ? attempts: 40%, 60%, 80%');
        $this->command->info('   CPE Student (12) ? attempts: 70%, 75%, 85%');
        $this->command->info('   EE  Student (13) ? attempts: 30%, 45%, 55%');
        $this->command->info('   Total attempts : 9 (3 per user)');
        $this->command->info('   Total results  : 90 (10 per attempt)');
        $this->command->info('   Lesson views   : 15 (5 per user)');
        $this->command->info('   Question stats : 5 rows');
    }
}
