<?php

namespace Modules\Achievements\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        // Check if achievements table already has data
        $existingCount = DB::table('achievements')->count();
        if ($existingCount > 0) {
            echo "Achievements table already has {$existingCount} records. Skipping...\n";
            return;
        }

        // Seed achievements matching the migration schema
        // Migration: criteria_type (enum), criteria_value (int)
        $achievements = [
            [
                'name' => 'First Steps',
                'description' => 'Complete your first practice exam',
                'icon' => '🎯',
                'criteria_type' => 'exam_count',
                'criteria_value' => 1,
                'points' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Perfect Score',
                'description' => 'Score 100% on any exam',
                'icon' => '🏆',
                'criteria_type' => 'perfect_score',
                'criteria_value' => 100,
                'points' => 50,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'High Achiever',
                'description' => 'Score 90% or above 5 times',
                'icon' => '⭐',
                'criteria_type' => 'score_threshold',
                'criteria_value' => 90,
                'points' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Dedicated Student',
                'description' => 'Complete 10 practice exams',
                'icon' => '📚',
                'criteria_type' => 'exam_count',
                'criteria_value' => 10,
                'points' => 25,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Week Warrior',
                'description' => 'Maintain a 7-day study streak',
                'icon' => '🔥',
                'criteria_type' => 'streak',
                'criteria_value' => 7,
                'points' => 40,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Subject Master',
                'description' => 'Master all topics in a subject',
                'icon' => '🎓',
                'criteria_type' => 'subject_mastery',
                'criteria_value' => 85,
                'points' => 60,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('achievements')->insert($achievements);
        echo "Achievements seeded.\n";

        // Check if user_achievements already has data
        $existingUserAchievements = DB::table('user_achievements')->count();
        if ($existingUserAchievements > 0) {
            echo "User achievements already has {$existingUserAchievements} records. Skipping...\n";
            return;
        }

        // Seed some user_achievements for testing
        // Migration uses 'achieved_at', not 'earned_at'
        $users = DB::table('users')->where('roleID', 1)->take(5)->get();
        
        if ($users->isNotEmpty()) {
            $achievementIds = DB::table('achievements')->pluck('id')->toArray();
            
            foreach ($users as $user) {
                // Give each user 1-3 random achievements
                $numAchievements = rand(1, min(3, count($achievementIds)));
                $selectedIds = (array) array_rand(array_flip($achievementIds), $numAchievements);

                foreach ($selectedIds as $achievementId) {
                    DB::table('user_achievements')->insert([
                        'user_id' => $user->userID,
                        'achievement_id' => $achievementId,
                        'achieved_at' => now()->subDays(rand(1, 30)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            echo "User achievements seeded.\n";
        }
    }
}