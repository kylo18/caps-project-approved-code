<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckSeedProgressCommand extends Command
{
    protected $signature = 'data:status';
    protected $description = 'Check current data generation status and table counts';

    public function handle(): int
    {
        $this->info('=== CAPS Database Status ===');
        $this->newLine();

        // Table counts
        $tables = ['users', 'subjects', 'questions', 'choices', 'practice_exam_results',
                   'exam_attempts', 'exam_results', 'student_grades'];

        $this->table(
            ['Table', 'Row Count'],
            collect($tables)->map(fn($t) => [$t, number_format(DB::table($t)->count())])->toArray()
        );

        $this->newLine();

        // Seed progress
        $progress = DB::table('seed_progress')->get();
        if ($progress->isNotEmpty()) {
            $this->warn('Active seed tasks:');
            $this->table(
                ['Task', 'Last ID', 'Updated At'],
                $progress->map(fn($p) => [$p->task, $p->last_id, $p->updated_at])->toArray()
            );
        } else {
            $this->info('No active seed tasks.');
        }

        $this->newLine();

        // User distribution
        $roleDist = DB::table('users')
            ->join('roles', 'users.roleID', '=', 'roles.roleID')
            ->select('roles.roleName', DB::raw('COUNT(*) as cnt'))
            ->groupBy('roles.roleName')
            ->orderByDesc('cnt')
            ->get();

        $this->info('User distribution by role:');
        foreach ($roleDist as $r) {
            $this->line("  {$r->roleName}: " . number_format($r->cnt));
        }

        $this->newLine();

        // New user codes (26-A-*)
        $newUsers = DB::table('users')->where('userCode', 'LIKE', '26-A-%')->count();
        $this->info("New test users (26-A-*): " . number_format($newUsers));

        // Subject variants
        $variantSubjects = DB::table('subjects')->where('subjectCode', 'LIKE', '%_%')->count();
        $this->info("Variant subjects (with underscore): " . number_format($variantSubjects));

        // Questions with choices
        $questionsWithChoices = DB::table('choices')
            ->distinct()->count('questionID');
        $totalQuestions = DB::table('questions')->count();
        $this->info("Questions with choices: " . number_format($questionsWithChoices) . ' / ' . number_format($totalQuestions));

        return 0;
    }
}