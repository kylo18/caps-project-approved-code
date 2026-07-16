<?php

namespace Modules\PracticeExams\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LeaderboardDummyDataSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing users and programs
        $users = DB::table('users')->where('roleID', 1)->get();
        $subjects = DB::table('subjects')->get();

        if ($users->isEmpty() || $subjects->isEmpty()) {
            echo "No users or subjects found. Please seed users and subjects first.\n";
            return;
        }

        $subjectIds = $subjects->pluck('subjectID')->toArray();

        // Clear existing dummy data (optional - comment out if you want to keep existing data)
        // DB::table('practice_exam_results')->delete();

        // Create 20 dummy leaderboard entries
        $dummyData = [
            ['percentage' => 95, 'totalPoints' => 100, 'earnedPoints' => 95, 'exams' => 12],
            ['percentage' => 92, 'totalPoints' => 100, 'earnedPoints' => 92, 'exams' => 15],
            ['percentage' => 88, 'totalPoints' => 100, 'earnedPoints' => 88, 'exams' => 18],
            ['percentage' => 85, 'totalPoints' => 100, 'earnedPoints' => 85, 'exams' => 20],
            ['percentage' => 82, 'totalPoints' => 100, 'earnedPoints' => 82, 'exams' => 14],
            ['percentage' => 80, 'totalPoints' => 100, 'earnedPoints' => 80, 'exams' => 16],
            ['percentage' => 78, 'totalPoints' => 100, 'earnedPoints' => 78, 'exams' => 11],
            ['percentage' => 75, 'totalPoints' => 100, 'earnedPoints' => 75, 'exams' => 19],
            ['percentage' => 72, 'totalPoints' => 100, 'earnedPoints' => 72, 'exams' => 13],
            ['percentage' => 70, 'totalPoints' => 100, 'earnedPoints' => 70, 'exams' => 17],
            ['percentage' => 68, 'totalPoints' => 100, 'earnedPoints' => 68, 'exams' => 10],
            ['percentage' => 65, 'totalPoints' => 100, 'earnedPoints' => 65, 'exams' => 22],
            ['percentage' => 62, 'totalPoints' => 100, 'earnedPoints' => 62, 'exams' => 8],
            ['percentage' => 60, 'totalPoints' => 100, 'earnedPoints' => 60, 'exams' => 25],
            ['percentage' => 58, 'totalPoints' => 100, 'earnedPoints' => 58, 'exams' => 9],
            ['percentage' => 55, 'totalPoints' => 100, 'earnedPoints' => 55, 'exams' => 14],
            ['percentage' => 52, 'totalPoints' => 100, 'earnedPoints' => 52, 'exams' => 7],
            ['percentage' => 50, 'totalPoints' => 100, 'earnedPoints' => 50, 'exams' => 20],
            ['percentage' => 48, 'totalPoints' => 100, 'earnedPoints' => 48, 'exams' => 6],
            ['percentage' => 45, 'totalPoints' => 100, 'earnedPoints' => 45, 'exams' => 5],
        ];

        $userArray = $users->toArray();
        $userCount = count($userArray);

        foreach ($dummyData as $index => $data) {
            // Use existing users or create from first user if not enough
            $userIndex = $index % $userCount;
            $user = $userArray[$userIndex];

            // Random subject
            $subjectId = $subjects->random()->subjectID;

            // Create multiple exam results per user to make it realistic
            for ($i = 0; $i < $data['exams']; $i++) {
                $variation = rand(-5, 5);
                $percentage = max(30, min(100, $data['percentage'] + $variation));
                
                DB::table('practice_exam_results')->insert([
                    'userID' => $user->userID,
                    'subjectID' => $subjectId,
                    'totalPoints' => $data['totalPoints'],
                    'earnedPoints' => (int)(($percentage / 100) * $data['totalPoints']),
                    'percentage' => $percentage,
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }

        echo "Leaderboard dummy data seeded successfully!\n";
    }
}
