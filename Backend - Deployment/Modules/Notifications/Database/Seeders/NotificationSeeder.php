<?php

namespace Modules\Notifications\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Check if notifications already has data
        $existingCount = DB::table('notifications')->count();
        if ($existingCount > 0) {
            echo "Notifications table already has {$existingCount} records. Skipping...\n";
            return;
        }

        // Get existing users
        $users = DB::table('users')->get();

        if ($users->isEmpty()) {
            echo "No users found. Please seed users first.\n";
            return;
        }

        // Seed sample notifications matching migration schema
        // Migration: type enum (achievement, lesson_available, quiz_result, system_announcement, milestone, enrollment)
        $notifications = [
            // Achievement notifications
            [
                'user_id' => $users->first()->userID,
                'type' => 'achievement',
                'name' => 'Achievement Earned',
                'title' => 'Achievement Unlocked!',
                'message' => 'Congratulations! You earned the "First Steps" achievement for completing your first exam.',
                'data' => json_encode(['achievement_id' => 1]),
                'is_read' => false,
                'created_at' => now()->subHours(2),
                'updated_at' => now(),
            ],
            [
                'user_id' => $users->first()->userID,
                'type' => 'milestone',
                'name' => 'High Achiever',
                'title' => 'High Achiever',
                'message' => 'You have scored 90% or above 5 times! Keep up the great work.',
                'data' => json_encode(['score' => 90, 'count' => 5]),
                'is_read' => true,
                'created_at' => now()->subDays(3),
                'updated_at' => now(),
            ],
            // Lesson notifications
            [
                'user_id' => $users->first()->userID,
                'type' => 'lesson_available',
                'name' => 'New Lesson',
                'title' => 'New Lesson Available',
                'message' => 'Chapter 5: Differential Equations is now available in Calculus 1.',
                'data' => json_encode(['subject_id' => 1, 'lesson_id' => 5]),
                'is_read' => false,
                'created_at' => now()->subDays(1),
                'updated_at' => now(),
            ],
            // Quiz result notifications
            [
                'user_id' => $users->first()->userID,
                'type' => 'quiz_result',
                'name' => 'Exam Alert',
                'title' => 'Exam Results Ready',
                'message' => 'Your practice exam for Calculus 1 has been graded. You scored 85%!',
                'data' => json_encode(['subject_id' => 1, 'percentage' => 85]),
                'is_read' => false,
                'created_at' => now()->subHours(5),
                'updated_at' => now(),
            ],
            // System announcement notifications
            [
                'user_id' => $users->first()->userID,
                'type' => 'system_announcement',
                'name' => 'System Update',
                'title' => 'System Announcement',
                'message' => 'The system will undergo maintenance on Sunday from 2 AM to 6 AM.',
                'data' => json_encode(['announcement_id' => 1]),
                'is_read' => true,
                'created_at' => now()->subDays(5),
                'updated_at' => now(),
            ],
        ];

        DB::table('notifications')->insert($notifications);
        echo "Notifications seeded.\n";

        // Add notifications for other users (skip first)
        foreach ($users->skip(1)->take(3) as $user) {
            DB::table('notifications')->insert([
                'user_id' => $user->userID,
                'type' => 'quiz_result',
                'name' => 'Exam Alert',
                'title' => 'New Exam Available',
                'message' => 'A new practice exam is now available for your enrolled subjects.',
                'data' => json_encode(['action' => 'practice']),
                'is_read' => false,
                'created_at' => now()->subHours(rand(1, 48)),
                'updated_at' => now(),
            ]);
        }
        echo "Additional user notifications seeded.\n";
    }
}