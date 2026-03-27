<?php

namespace Modules\Analytics\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        // Check if content_analytics already has data
        if (DB::table('content_analytics')->count() > 0) {
            echo "Content analytics already seeded. Skipping...\n";
        } else {
            // Get existing users and subjects
            $users = DB::table('users')->where('roleID', 1)->take(10)->get();
            $subjects = DB::table('subjects')->take(5)->get();

            if ($users->isEmpty()) {
                echo "No users found. Please seed users first.\n";
            } elseif ($subjects->isEmpty()) {
                echo "No subjects found. Please seed subjects first.\n";
            } else {
                // Seed content_analytics matching migration schema
                // Migration: user_id, subject_id, question_id, interaction_type, time_spent_seconds
                foreach ($users as $user) {
                    foreach ($subjects as $subject) {
                        // Lesson view interactions
                        DB::table('content_analytics')->insert([
                            'user_id' => $user->userID,
                            'subject_id' => $subject->subjectID,
                            'question_id' => null,
                            'interaction_type' => 'lesson_view',
                            'time_spent_seconds' => rand(300, 3600),
                            'created_at' => now()->subDays(rand(1, 30)),
                        ]);

                        // Quiz attempt interactions
                        DB::table('content_analytics')->insert([
                            'user_id' => $user->userID,
                            'subject_id' => $subject->subjectID,
                            'question_id' => null,
                            'interaction_type' => 'quiz_attempt',
                            'time_spent_seconds' => rand(600, 1800),
                            'created_at' => now()->subDays(rand(1, 30)),
                        ]);
                    }
                }
                echo "Content analytics seeded.\n";
            }
        }

        // Check if learning_difficulty_analytics already has data
        if (DB::table('learning_difficulty_analytics')->count() > 0) {
            echo "Learning difficulty analytics already seeded. Skipping...\n";
            return;
        }

        // Get existing questions and subjects
        $questions = DB::table('questions')->get();
        $subjects = DB::table('subjects')->get();

        if ($questions->isEmpty()) {
            echo "No questions found. Please seed questions first.\n";
            return;
        }

        // Seed learning_difficulty_analytics matching migration schema
        // Migration: subject_id, question_id, total_attempts, correct_attempts, error_rate, avg_attempts_to_pass, difficulty_index
        foreach ($subjects as $subject) {
            $subjectQuestions = $questions->where('subjectID', $subject->subjectID)->take(10);
            
            foreach ($subjectQuestions as $question) {
                $totalAttempts = rand(20, 100);
                $correctAttempts = rand(5, $totalAttempts);
                
                DB::table('learning_difficulty_analytics')->insert([
                    'subject_id' => $subject->subjectID,
                    'question_id' => $question->questionID,
                    'total_attempts' => $totalAttempts,
                    'correct_attempts' => $correctAttempts,
                    'average_attempts' => round($totalAttempts / max(1, $correctAttempts), 2),
                    'difficulty_index' => round($correctAttempts / $totalAttempts, 2),
                    'average_time_seconds' => rand(30, 180),
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now(),
                ]);
            }
        }
        echo "Learning difficulty analytics seeded.\n";
    }

    private function getDifficultyIndex(int $totalAttempts, int $correctAttempts): string
    {
        $successRate = ($correctAttempts / $totalAttempts) * 100;
        
        if ($successRate >= 70) return 'easy';
        if ($successRate >= 40) return 'medium';
        return 'hard';
    }
}