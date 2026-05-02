<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Users\Models\User;

class SyncStudentsToStudentCurricula extends Command
{
    protected $signature = 'students:sync-curricula';
    protected $description = 'Sync all student users into the student_curricula table with correct curriculumID.';

    public function handle()
    {
        $students = User::where('roleID', 1)->get();
        $inserted = 0;
        foreach ($students as $student) {
            // Assign New Curriculum (2) if userCode starts with 24- or higher, else Old (1)
            $yearPrefix = intval(substr($student->userCode, 0, 2));
            $curriculumID = ($yearPrefix >= 24) ? 2 : 1;
            $exists = DB::table('student_curricula')->where('userID', $student->userID)->exists();
            if (!$exists) {
                DB::table('student_curricula')->insert([
                    'userID' => $student->userID,
                    'curriculumID' => $curriculumID,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $inserted++;
            }
        }
        $this->info("Inserted $inserted new student curricula records.");
        return 0;
    }
} 