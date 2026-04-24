<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Modules\Users\Models\IssueType;
use Modules\Users\Models\IssueTypeVariant;
use Modules\Users\Models\StatusStandardization;
use Modules\Users\Models\StatusVariant;
use Modules\Users\Models\CategoryStandardization;
use Modules\Users\Models\CategoryVariant;

class FeedbackStandardizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Issue Types
        $technicalIssue = IssueType::create(['name' => 'Technical Issue', 'description' => 'Database connection errors, SQL query failures, system crashes, or other platform technical issues.']);
        $accountLogin = IssueType::create(['name' => 'Account & Login', 'description' => 'Login authentication problems, password reset issues, account access denied, or credential errors.']);
        $examQuiz = IssueType::create(['name' => 'Exam / Quiz Problem', 'description' => 'Exam questions not loading, answers not saving, timer issues, or submission problems.']);
        $notification = IssueType::create(['name' => 'Notification Problem', 'description' => 'Email notifications not sending, alerts not working, or communication system failures.']);
        $performance = IssueType::create(['name' => 'Performance & Ranking', 'description' => 'Slow system response, database performance issues, or platform speed problems.']);
        $feature = IssueType::create(['name' => 'Feature Request', 'description' => 'Suggestions for new features, system improvements, or functionality enhancements.']);
        $other = IssueType::create(['name' => 'Other', 'description' => 'Any other issues not covered by the above categories.']);

        // Create Issue Type Variants
        $technicalIssue->variants()->createMany([
            ['variant' => 'tech'], ['variant' => 'technical issue'], ['variant' => 'technical'],
            ['variant' => 'tech issue'], ['variant' => 'system issue']
        ]);

        $accountLogin->variants()->createMany([
            ['variant' => 'accesserror'], ['variant' => 'login problem'], ['variant' => 'access issue'],
            ['variant' => 'login issue'], ['variant' => 'cannot login'], ['variant' => 'access denied'],
            ['variant' => 'authentication'], ['variant' => 'account'], ['variant' => 'login']
        ]);

        $examQuiz->variants()->createMany([
            ['variant' => 'exam problem'], ['variant' => 'quiz problem'], ['variant' => 'exam issue'],
            ['variant' => 'quiz issue'], ['variant' => 'test problem'], ['variant' => 'exam'],
            ['variant' => 'quiz']
        ]);

        $notification->variants()->createMany([
            ['variant' => 'notif'], ['variant' => 'email problem'], ['variant' => 'notification'],
            ['variant' => 'email issue'], ['variant' => 'notification issue'], ['variant' => 'mail problem']
        ]);

        $performance->variants()->createMany([
            ['variant' => 'performance'], ['variant' => 'ranking'], ['variant' => 'performance issue'],
            ['variant' => 'ranking issue']
        ]);

        $feature->variants()->createMany([
            ['variant' => 'feature'], ['variant' => 'request'], ['variant' => 'new feature'],
            ['variant' => 'feature suggestion']
        ]);

        $other->variants()->createMany([
            ['variant' => 'other'], ['variant' => 'misc'], ['variant' => 'general']
        ]);

        // Create Statuses
        $inProgress = StatusStandardization::create(['normalized_name' => 'In Progress']);
        $resolved = StatusStandardization::create(['normalized_name' => 'Resolved']);

        // Create Status Variants
        $inProgress->variants()->createMany([
            ['variant' => 'inprogress'], ['variant' => 'in progress'],
            ['variant' => 'working'], ['variant' => 'processing']
        ]);

        $resolved->variants()->createMany([
            ['variant' => 'fixed'], ['variant' => 'resolve'], ['variant' => 'done'],
            ['variant' => 'completed'], ['variant' => 'closed'],
            ['variant' => 'solved']
        ]);

        // Create Categories
        $critical = CategoryStandardization::create(['normalized_name' => 'Critical', 'priority' => 1]);
        $major = CategoryStandardization::create(['normalized_name' => 'Major', 'priority' => 2]);
        $minor = CategoryStandardization::create(['normalized_name' => 'Minor', 'priority' => 3]);

        // Create Category Variants
        $critical->variants()->createMany([
            ['variant' => 'urgent'], ['variant' => 'severe'], ['variant' => 'emergency']
        ]);

        $major->variants()->createMany([
            ['variant' => 'medium'], ['variant' => 'moderate'], ['variant' => 'high']
        ]);

        $minor->variants()->createMany([
            ['variant' => 'small'], ['variant' => 'low']
        ]);

        // Create Subject-Issue Type Relationships
        $databaseSystems->issueTypes()->createMany([
            ['issue_type_id' => $technicalIssue->id],
            ['issue_type_id' => $accountLogin->id],
            ['issue_type_id' => $notification->id],
            ['issue_type_id' => $performance->id],
        ]);

        $electronics1->issueTypes()->createMany([
            ['issue_type_id' => $technicalIssue->id],
            ['issue_type_id' => $examQuiz->id],
            ['issue_type_id' => $performance->id],
            ['issue_type_id' => $feature->id],
        ]);

        $programmingLogic->issueTypes()->createMany([
            ['issue_type_id' => $technicalIssue->id],
            ['issue_type_id' => $examQuiz->id],
            ['issue_type_id' => $feature->id],
        ]);

        $collegeAlgebra->issueTypes()->createMany([
            ['issue_type_id' => $technicalIssue->id],
            ['issue_type_id' => $examQuiz->id],
            ['issue_type_id' => $accountLogin->id],
        ]);
    }
}
