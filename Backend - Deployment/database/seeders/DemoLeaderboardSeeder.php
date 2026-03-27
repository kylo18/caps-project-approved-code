<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Services\LeaderboardService;
use Carbon\Carbon;

class DemoLeaderboardSeeder extends Seeder
{
    public function run(): void
    {
        $leaderboard = app(LeaderboardService::class);
        $subjectId = DB::table('subjects')->value('subjectID') ?? 1;

        // 1. Create 5 Mock Students if they don't exist
        $students = [
            ['firstName' => 'Juan', 'lastName' => 'Dela Cruz', 'email' => 'juan@example.test', 'score' => 98],
            ['firstName' => 'Maria', 'lastName' => 'Clara', 'email' => 'maria@example.test', 'score' => 95],
            ['firstName' => 'Rizal', 'lastName' => 'Jose', 'email' => 'rizal@example.test', 'score' => 88],
            ['firstName' => 'Andres', 'lastName' => 'Bonifacio', 'email' => 'andres@example.test', 'score' => 82],
            ['firstName' => 'Emilio', 'lastName' => 'Aguinaldo', 'email' => 'emilio@example.test', 'score' => 75],
        ];

        $this->command->info('Seeding Demo Data...');

        foreach ($students as $data) {
            // Create User
            $userId = DB::table('users')->updateOrInsert(
                ['email' => $data['email']],
                [
                    'firstName' => $data['firstName'],
                    'lastName' => $data['lastName'],
                    'userCode' => 'STU-' . rand(1000, 9999),
                    'password' => bcrypt('password'),
                    'roleID' => 1, // Student
                    'status_id' => 2, // Approved
                    'campusID' => 1, // Added to fix missing default value
                    'programID' => 1, // Added to ensure completeness
                    'isActive' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Get the ID (since updateOrInsert doesn't return it directly)
            $user = DB::table('users')->where('email', $data['email'])->first();
            $uid = $user->userID;

            // 2. Create a Mock Attempt
            $attemptId = DB::table('exam_attempts')->insertGetId([
                'user_id' => $uid,
                'exam_id' => 1,
                'started_at' => now()->subMinutes(30),
                'finished_at' => now(),
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Create Analytics Record
            DB::table('exam_analytics')->updateOrInsert(
                ['attempt_id' => $attemptId],
                [
                    'user_id' => $uid,
                    'overall_score' => $data['score'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // 4. PUSH TO REDIS LEADERBOARD (The most important part for the demo)
            $finishedAt = Carbon::now();
            $composite = $leaderboard->computeComposite($data['score'], $finishedAt);
            
            // Global
            $leaderboard->updateScoreConditionally($leaderboard->buildKey('global'), $composite, $uid);
            
            // Exam Specific
            $leaderboard->updateScoreConditionally($leaderboard->buildKey('exam', 1), $composite, $uid);

            $this->command->info("Added: {$data['firstName']} {$data['lastName']} with Score: {$data['score']}%");
        }

        $this->command->info('Demo data seeded successfully! Check your leaderboard now.');
    }
}
