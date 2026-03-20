<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedLeaderboardDummyData extends Command
{
    protected $signature = 'leaderboard:seed-dummy {--clear : Clear existing leaderboard data before seeding}';

    protected $description = 'Seed exactly 20 dummy leaderboard entries for testing';

    public function handle()
    {
        $this->info('Seeding exactly 20 leaderboard dummy entries...');

        // Get users (not just students - include faculty too for demo)
        $users = DB::table('users')->get();
        $subjects = DB::table('subjects')->get();

        if ($users->isEmpty() || $subjects->isEmpty()) {
            $this->error('No users or subjects found. Please seed users and subjects first.');
            return 1;
        }

        if ($this->option('clear')) {
            DB::table('practice_exam_results')->delete();
            $this->info('Cleared existing leaderboard data.');
        }

        // Exactly 20 different users with unique names
        $dummyData = [
            ['firstName' => 'John', 'lastName' => 'Smith', 'percentage' => 95, 'exams' => 20],
            ['firstName' => 'Maria', 'lastName' => 'Garcia', 'percentage' => 92, 'exams' => 18],
            ['firstName' => 'James', 'lastName' => 'Wilson', 'percentage' => 88, 'exams' => 22],
            ['firstName' => 'Sarah', 'lastName' => 'Johnson', 'percentage' => 85, 'exams' => 15],
            ['firstName' => 'Michael', 'lastName' => 'Brown', 'percentage' => 82, 'exams' => 25],
            ['firstName' => 'Emily', 'lastName' => 'Davis', 'percentage' => 80, 'exams' => 12],
            ['firstName' => 'David', 'lastName' => 'Miller', 'percentage' => 78, 'exams' => 19],
            ['firstName' => 'Jennifer', 'lastName' => 'Taylor', 'percentage' => 75, 'exams' => 16],
            ['firstName' => 'Robert', 'lastName' => 'Anderson', 'percentage' => 72, 'exams' => 21],
            ['firstName' => 'Lisa', 'lastName' => 'Thomas', 'percentage' => 70, 'exams' => 14],
            ['firstName' => 'William', 'lastName' => 'Jackson', 'percentage' => 68, 'exams' => 17],
            ['firstName' => 'Amanda', 'lastName' => 'White', 'percentage' => 65, 'exams' => 23],
            ['firstName' => 'Christopher', 'lastName' => 'Harris', 'percentage' => 62, 'exams' => 11],
            ['firstName' => 'Jessica', 'lastName' => 'Martin', 'percentage' => 60, 'exams' => 24],
            ['firstName' => 'Daniel', 'lastName' => 'Thompson', 'percentage' => 58, 'exams' => 13],
            ['firstName' => 'Ashley', 'lastName' => 'Martinez', 'percentage' => 55, 'exams' => 18],
            ['firstName' => 'Matthew', 'lastName' => 'Robinson', 'percentage' => 52, 'exams' => 10],
            ['firstName' => 'Stephanie', 'lastName' => 'Clark', 'percentage' => 50, 'exams' => 15],
            ['firstName' => 'Anthony', 'lastName' => 'Rodriguez', 'percentage' => 48, 'exams' => 8],
            ['firstName' => 'Nicole', 'lastName' => 'Lewis', 'percentage' => 45, 'exams' => 6],
        ];

        // First, create 20 new users with these names
        $createdUsers = [];
        $userCount = $users->count();
        
        foreach ($dummyData as $index => $data) {
            $userID = $index + 2000; // Start from 2000 to avoid conflicts
            
            // Create user
            DB::table('users')->insert([
                'userID' => $userID,
                'userCode' => '25-A-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'firstName' => $data['firstName'],
                'lastName' => $data['lastName'],
                'email' => strtolower($data['firstName'] . '.' . $data['lastName']) . '@caps.edu',
                'password' => bcrypt('password123'),
                'roleID' => 1, // Student role
                'campusID' => 1,
                'programID' => ($index % 6) + 1, // Distribute across programs
                'status_id' => 4,
                'isActive' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $createdUsers[] = $userID;
        }

        $this->info('Created 20 new student users.');

        // Now create exam results for these 20 users
        $subjectIds = $subjects->pluck('subjectID')->toArray();
        $inserted = 0;

        foreach ($dummyData as $index => $data) {
            $userID = $createdUsers[$index];
            
            // Assign to random subject
            $subjectId = $subjects->random()->subjectID;

            // Create exam results for this user (multiple exams to show variation)
            for ($i = 0; $i < $data['exams']; $i++) {
                $variation = rand(-3, 3);
                $percentage = max(35, min(100, $data['percentage'] + $variation));
                
                DB::table('practice_exam_results')->insert([
                    'userID' => $userID,
                    'subjectID' => $subjectId,
                    'totalPoints' => 100,
                    'earnedPoints' => (int)(($percentage / 100) * 100),
                    'percentage' => $percentage,
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now()->subDays(rand(1, 30)),
                ]);
                $inserted++;
            }
        }

        $this->info("Successfully seeded {$inserted} exam results for 20 leaderboard entries!");
        return 0;
    }
}
