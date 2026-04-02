<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FeatureTablesSeeder extends Seeder
{
    public function run(): void
    {
        $users = DB::table('users')->select('userID', 'roleID')->get();
        $students = $users->where('roleID', 1)->values();
        $staff = $users->where('roleID', '!=', 1)->values();
        $subjects = DB::table('subjects')->select('subjectID')->get();

        $this->seedAchievements($students);
        $this->seedFaqs();
        $this->seedSupportTickets($students, $staff);
        $this->seedNotifications($users, $subjects);
        $this->seedContentAnalytics($students, $subjects);
        $this->seedPracticeExamAnswers($students);
        $this->seedLeaderboards($students, $subjects);
    }

    private function seedAchievements(Collection $students): void
    {
        if (!Schema::hasTable('achievements') || !Schema::hasTable('user_achievements')) {
            return;
        }

        if (DB::table('achievements')->count() === 0) {
            $now = now();
            if (Schema::hasColumn('achievements', 'title')) {
                DB::table('achievements')->insert([
                    [
                        'title' => 'First Attempt',
                        'description' => 'Complete your first practice exam.',
                        'icon_path' => 'icons/achievements/first-attempt.png',
                        'required_exams' => 1,
                        'tier' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                    [
                        'title' => 'Steady Climber',
                        'description' => 'Finish five practice exams.',
                        'icon_path' => 'icons/achievements/steady-climber.png',
                        'required_exams' => 5,
                        'tier' => 2,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                    [
                        'title' => 'Exam Veteran',
                        'description' => 'Finish ten practice exams.',
                        'icon_path' => 'icons/achievements/exam-veteran.png',
                        'required_exams' => 10,
                        'tier' => 3,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                ]);
            } else {
                DB::table('achievements')->insert([
                    [
                        'name' => 'First Steps',
                        'description' => 'Complete your first practice exam.',
                        'icon' => 'target',
                        'criteria_type' => 'exam_count',
                        'criteria_value' => 1,
                        'points' => 10,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                    [
                        'name' => 'High Achiever',
                        'description' => 'Score at least 90% in a practice exam.',
                        'icon' => 'star',
                        'criteria_type' => 'score_threshold',
                        'criteria_value' => 90,
                        'points' => 25,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                    [
                        'name' => 'Dedicated Student',
                        'description' => 'Complete ten practice exams.',
                        'icon' => 'book-open',
                        'criteria_type' => 'exam_count',
                        'criteria_value' => 10,
                        'points' => 40,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                ]);
            }
        }

        if (DB::table('user_achievements')->count() > 0 || $students->isEmpty()) {
            return;
        }

        $timestampColumn = Schema::hasColumn('user_achievements', 'earned_at') ? 'earned_at' : 'achieved_at';
        $achievementIds = DB::table('achievements')->pluck('id')->all();

        if (empty($achievementIds)) {
            return;
        }

        $rows = [];
        foreach ($students->take(min(5, $students->count())) as $index => $student) {
            foreach (array_slice($achievementIds, 0, min($index + 1, count($achievementIds))) as $achievementId) {
                $earnedAt = now()->subDays(($index + 1) * 2);
                $rows[] = [
                    'user_id' => $student->userID,
                    'achievement_id' => $achievementId,
                    $timestampColumn => $earnedAt,
                    'created_at' => $earnedAt,
                    'updated_at' => $earnedAt,
                ];
            }
        }

        if (!empty($rows)) {
            DB::table('user_achievements')->insert($rows);
        }
    }

    private function seedFaqs(): void
    {
        if (!Schema::hasTable('faq_categories') || !Schema::hasTable('faqs')) {
            return;
        }

        $categoryNameColumn = Schema::hasColumn('faq_categories', 'name') ? 'name' : 'subject';

        if (DB::table('faq_categories')->count() === 0) {
            $now = now();
            DB::table('faq_categories')->insert([
                [
                    $categoryNameColumn => 'Account',
                    'display_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    $categoryNameColumn => 'Practice Exams',
                    'display_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    $categoryNameColumn => 'Technical',
                    'display_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]);
        }

        if (DB::table('faqs')->count() > 0) {
            return;
        }

        $categories = DB::table('faq_categories')->get()->keyBy($categoryNameColumn);
        $now = now();

        DB::table('faqs')->insert([
            [
                'category_id' => optional($categories->get('Account'))->id,
                'question' => 'How do I update my profile details?',
                'answer' => 'Open your profile page, edit the fields you need, then save your changes.',
                'is_active' => true,
                'display_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => optional($categories->get('Practice Exams'))->id,
                'question' => 'How is my practice exam score recorded?',
                'answer' => 'Each completed exam stores your earned points, percentage, and leaderboard progress automatically.',
                'is_active' => true,
                'display_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => optional($categories->get('Technical'))->id,
                'question' => 'What should I do if the app stops syncing?',
                'answer' => 'Reconnect to the internet, reopen the app, and try the action again. Contact support if the issue continues.',
                'is_active' => true,
                'display_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    private function seedSupportTickets(Collection $students, Collection $staff): void
    {
        if (!Schema::hasTable('support_tickets') || $students->isEmpty() || DB::table('support_tickets')->count() > 0) {
            return;
        }

        $resolverId = optional($staff->first())->userID;
        $now = now();

        DB::table('support_tickets')->insert([
            [
                'user_id' => $students->first()->userID,
                'subject' => 'Unable to submit practice exam',
                'description' => 'The submit button stays disabled after I answer the last question.',
                'category' => 'technical',
                'status' => 'open',
                'priority' => 'high',
                'resolved_by' => null,
                'resolved_at' => null,
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(1),
            ],
            [
                'user_id' => optional($students->skip(1)->first() ?? $students->first())->userID,
                'subject' => 'Clarification on exam retakes',
                'description' => 'I want to confirm whether retaking a practice exam replaces the previous score or keeps both attempts.',
                'category' => 'academic',
                'status' => $resolverId ? 'resolved' : 'in_progress',
                'priority' => 'medium',
                'resolved_by' => $resolverId,
                'resolved_at' => $resolverId ? $now->copy()->subHours(12) : null,
                'created_at' => $now->copy()->subDays(4),
                'updated_at' => $now->copy()->subHours(12),
            ],
        ]);
    }

    private function seedNotifications(Collection $users, Collection $subjects): void
    {
        if (!Schema::hasTable('notifications') || $users->isEmpty() || DB::table('notifications')->count() > 0) {
            return;
        }

        $notifications = [];
        $subjectId = optional($subjects->first())->subjectID;

        foreach ($users->take(min(4, $users->count())) as $index => $user) {
            $row = [
                'user_id' => $user->userID,
                'type' => $index === 0 ? 'achievement' : 'quiz_result',
                'title' => $index === 0 ? 'Achievement unlocked' : 'Practice exam recorded',
                'message' => $index === 0
                    ? 'You reached a new milestone in CAPS.'
                    : 'Your latest practice exam result is ready to review.',
                'data' => json_encode([
                    'subject_id' => $subjectId,
                    'sequence' => $index + 1,
                ]),
                'is_read' => $index > 1,
                'created_at' => now()->subHours(($index + 1) * 3),
                'updated_at' => now()->subHours(($index + 1) * 2),
            ];

            if (Schema::hasColumn('notifications', 'name')) {
                $row['name'] = $index === 0 ? 'Milestone' : 'Exam Update';
            }

            if (Schema::hasColumn('notifications', 'action_url')) {
                $row['action_url'] = $subjectId ? "/subjects/{$subjectId}" : '/notifications';
            }

            $notifications[] = $row;
        }

        DB::table('notifications')->insert($notifications);
    }

    private function seedContentAnalytics(Collection $students, Collection $subjects): void
    {
        if (!Schema::hasTable('content_analytics') || $students->isEmpty() || $subjects->isEmpty() || DB::table('content_analytics')->count() > 0) {
            return;
        }

        $questionsBySubject = DB::table('questions')
            ->select('questionID', 'subjectID')
            ->get()
            ->groupBy('subjectID');

        $rows = [];

        foreach ($students->take(min(5, $students->count())) as $student) {
            foreach ($subjects->take(min(3, $subjects->count())) as $subject) {
                $subjectQuestions = $questionsBySubject->get($subject->subjectID, collect());

                foreach (['lesson_view', 'quiz_attempt'] as $interactionType) {
                    $row = [
                        'user_id' => $student->userID,
                        'subject_id' => $subject->subjectID,
                        'interaction_type' => $interactionType,
                        'time_spent_seconds' => $interactionType === 'lesson_view' ? rand(240, 900) : rand(120, 600),
                        'created_at' => now()->subDays(rand(1, 14)),
                    ];

                    if (Schema::hasColumn('content_analytics', 'question_id')) {
                        $row['question_id'] = optional($subjectQuestions->first())->questionID;
                    }

                    if (Schema::hasColumn('content_analytics', 'updated_at')) {
                        $row['updated_at'] = $row['created_at'];
                    }

                    $rows[] = $row;
                }
            }
        }

        if (!empty($rows)) {
            DB::table('content_analytics')->insert($rows);
        }
    }

    private function seedPracticeExamAnswers(Collection $students): void
    {
        if (!Schema::hasTable('practice_exam_answers') || DB::table('practice_exam_answers')->count() > 0) {
            return;
        }

        $results = DB::table('practice_exam_results')
            ->select('resultID', 'userID', 'subjectID')
            ->orderBy('resultID')
            ->get();

        if ($results->isEmpty()) {
            return;
        }

        $questionsBySubject = DB::table('questions')
            ->select('questionID', 'subjectID')
            ->get()
            ->groupBy('subjectID');

        $choicesByQuestion = DB::table('choices')
            ->select('choiceID', 'questionID', 'isCorrect')
            ->orderBy('choiceID')
            ->get()
            ->groupBy('questionID');

        $rows = [];

        foreach ($results->take(15) as $result) {
            $questions = $questionsBySubject->get($result->subjectID, collect())->take(5);

            foreach ($questions as $questionIndex => $question) {
                $choices = $choicesByQuestion->get($question->questionID, collect());
                $correctChoice = $choices->firstWhere('isCorrect', 1) ?? $choices->first();
                $selectedChoice = $questionIndex % 4 === 3 ? null : ($questionIndex % 2 === 0 ? $correctChoice : $choices->first());
                $isCorrect = $selectedChoice !== null && $correctChoice !== null && $selectedChoice->choiceID === $correctChoice->choiceID;
                $createdAt = now()->subDays(rand(1, 10));

                $rows[] = [
                    'result_id' => $result->resultID,
                    'user_id' => $result->userID,
                    'question_id' => $question->questionID,
                    'selected_choice_id' => $selectedChoice?->choiceID,
                    'is_correct' => $isCorrect,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }
        }

        if (!empty($rows)) {
            DB::table('practice_exam_answers')->insert($rows);
        }
    }

    private function seedLeaderboards(Collection $students, Collection $subjects): void
    {
        if (!Schema::hasTable('leaderboards') || DB::table('leaderboards')->count() > 0) {
            return;
        }

        $results = DB::table('practice_exam_results')
            ->select('userID', 'subjectID', 'percentage')
            ->get();

        $rows = [];

        if ($results->isNotEmpty()) {
            foreach ($results->groupBy(fn ($result) => $result->userID . ':' . $result->subjectID) as $group) {
                $first = $group->first();
                $createdAt = now()->subDays(rand(1, 10));
                $rows[] = [
                    'userID' => $first->userID,
                    'subjectID' => $first->subjectID,
                    'highest_percentage' => round($group->max('percentage'), 2),
                    'total_exams' => $group->count(),
                    'score' => round($group->max('percentage'), 2),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }
        } elseif ($students->isNotEmpty() && $subjects->isNotEmpty()) {
            foreach ($students->take(min(5, $students->count())) as $student) {
                foreach ($subjects->take(min(2, $subjects->count())) as $subject) {
                    $createdAt = now()->subDays(rand(1, 10));
                    $score = rand(60, 95);
                    $rows[] = [
                        'userID' => $student->userID,
                        'subjectID' => $subject->subjectID,
                        'highest_percentage' => $score,
                        'total_exams' => rand(1, 4),
                        'score' => $score,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ];
                }
            }
        }

        if (!empty($rows)) {
            DB::table('leaderboards')->insert($rows);
        }
    }
}
