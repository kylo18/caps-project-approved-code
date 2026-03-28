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

        if ($this->command) {
            $this->command->info('Seeding Demo Data...');
        } else {
            echo "Seeding Demo Data...\n";
        }

        foreach ($students as $data) {
            // Check if user exists
            $user = DB::table('users')->where('email', $data['email'])->first();
            $userCode = $user ? $user->userCode : 'STU-' . rand(1000, 9999);

            // Create/Update User
            DB::table('users')->updateOrInsert(
                ['email' => $data['email']],
                [
                    'firstName' => $data['firstName'],
                    'lastName' => $data['lastName'],
                    'userCode' => $userCode,
                    'password' => bcrypt('password'),
                    'roleID' => 1, // Student
                    'status_id' => 2, // Approved
                    'campusID' => 1,
                    'programID' => 1,
                    'isActive' => 1,
                    'updated_at' => now(),
                ]
            );

            // Get the fresh user data
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

            // 4. Create Practice Exam Result Record
            DB::table('practice_exam_results')->updateOrInsert(
                [
                    'userID' => $uid,
                    'subjectID' => $subjectId,
                ],
                [
                    'totalPoints' => 100,
                    'earnedPoints' => $data['score'],
                    'percentage' => $data['score'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // 5. Create Student Record (Ensures Year Level is visible)
            DB::table('students')->updateOrInsert(
                ['userCode' => $user->userCode],
                [
                    'fullName' => $user->firstName . ' ' . $user->lastName,
                    'lastName' => $user->lastName,
                    'firstName_middleName' => $user->firstName,
                    'sex_id' => 1, // Assume 1 for MALE based on sexes table
                    'yearLevel' => 4, // Integer expected (4 for 4th Year)
                    'programID' => 1,
                    'block' => 'A',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // 6. PUSH TO REDIS LEADERBOARD
            $finishedAt = Carbon::now();
            $composite = $leaderboard->computeComposite($data['score'], $finishedAt);

            // Global
            $leaderboard->updateScoreConditionally($leaderboard->buildKey('global'), $composite, $uid);

            // Exam Specific
            $leaderboard->updateScoreConditionally($leaderboard->buildKey('exam', 1), $composite, $uid);

            $msg = "Added: {$data['firstName']} {$data['lastName']} with Score: {$data['score']}%";
            if ($this->command) {
                $this->command->info($msg);
            } else {
                echo $msg . "\n";
            }
        }

        if ($this->command) {
            $this->command->info('Demo data seeded successfully! Check your leaderboard now.');
        } else {
            echo "Demo data seeded successfully!\n";
        }
    }
}
