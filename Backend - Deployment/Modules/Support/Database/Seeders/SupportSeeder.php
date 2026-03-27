<?php

namespace Modules\Support\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupportSeeder extends Seeder
{
    public function run(): void
    {
        // Check if faq_categories already has data
        if (DB::table('faq_categories')->count() > 0) {
            echo "FAQ categories already seeded. Skipping...\n";
        } else {
            // Seed FAQ categories matching migration schema
            $categories = [
                ['subject' => 'Account', 'display_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['subject' => 'Exams', 'display_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['subject' => 'Technical', 'display_order' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['subject' => 'Billing', 'display_order' => 4, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ];
            DB::table('faq_categories')->insert($categories);
            echo "FAQ categories seeded.\n";
        }

        // Check if faqs already has data
        if (DB::table('faqs')->count() > 0) {
            echo "FAQs already seeded. Skipping...\n";
        } else {
            // Get category IDs
            $accountCategory = DB::table('faq_categories')->where('subject', 'Account')->first();
            $examsCategory = DB::table('faq_categories')->where('subject', 'Exams')->first();
            $technicalCategory = DB::table('faq_categories')->where('subject', 'Technical')->first();

            // Seed FAQs matching migration schema
            $faqs = [
                // Account FAQs
                [
                    'category_id' => $accountCategory->id,
                    'question' => 'How do I reset my password?',
                    'answer' => 'Click on "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox.',
                    'display_order' => 1,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'category_id' => $accountCategory->id,
                    'question' => 'How do I update my profile information?',
                    'answer' => 'Go to Profile > Edit Profile, update your details, and save changes.',
                    'display_order' => 2,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                // Exam FAQs
                [
                    'category_id' => $examsCategory->id,
                    'question' => 'How do I take a practice exam?',
                    'answer' => 'Select a subject from the practice subjects list, then click "Start Exam" to begin.',
                    'display_order' => 1,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'category_id' => $examsCategory->id,
                    'question' => 'What happens if I run out of time?',
                    'answer' => 'The exam will auto-submit when time expires. Your answers up to that point will be saved.',
                    'display_order' => 2,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                // Technical FAQs
                [
                    'category_id' => $technicalCategory->id,
                    'question' => 'The exam page is not loading properly',
                    'answer' => 'Try refreshing the page, clear your browser cache, or use a different browser. Ensure you have stable internet.',
                    'display_order' => 1,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];
            DB::table('faqs')->insert($faqs);
            echo "FAQs seeded.\n";
        }

        // Check if support_tickets already has data
        if (DB::table('support_tickets')->count() > 0) {
            echo "Support tickets already seeded. Skipping...\n";
            return;
        }

        // Seed sample support tickets matching migration schema
        // Migration: subject, description (not message), category, status, priority
        $users = DB::table('users')->where('roleID', 1)->take(3)->get();
        
        if ($users->isNotEmpty()) {
            $tickets = [
                [
                    'user_id' => $users->first()->userID,
                    'subject' => 'Cannot submit exam answers',
                    'description' => 'When I click submit, the page freezes and nothing happens. I have tried multiple times on different browsers.',
                    'category' => 'technical',
                    'status' => 'open',
                    'priority' => 'high',
                    'created_at' => now()->subDays(2),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $users->get(1)->userID,
                    'subject' => 'Question about exam duration',
                    'description' => 'How long do I have to complete a practice exam? Is it the same for all subjects?',
                    'category' => 'academic',
                    'status' => 'resolved',
                    'priority' => 'low',
                    'resolved_by' => $users->first()->userID,
                    'resolved_at' => now()->subDays(5),
                    'created_at' => now()->subDays(7),
                    'updated_at' => now()->subDays(5),
                ],
            ];
            DB::table('support_tickets')->insert($tickets);
            echo "Support tickets seeded.\n";
        }
    }
}