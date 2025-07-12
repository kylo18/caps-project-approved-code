<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Users\Models\User;

class AssignStudentCurricula extends Command
{
    protected $signature = 'students:assign-curricula';
    protected $description = 'Assign students to Old or New curriculum in student_curricula table based on userCode';

    public function handle()
    {
        $students = User::where('roleID', 1)->get();
        $count = 0;
        foreach ($students as $student) {
            // Assign New Curriculum (2) if userCode starts with 24- or higher, else Old (1)
            $yearPrefix = intval(substr($student->userCode, 0, 2));
            $curriculumID = ($yearPrefix >= 24) ? 2 : 1;
            DB::table('student_curricula')->updateOrInsert(
                ['userID' => $student->userID],
                [
                    'curriculumID' => $curriculumID,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $count++;
        }
        $this->info("Assigned curriculum for $count students.");
        return 0;
    }
} 