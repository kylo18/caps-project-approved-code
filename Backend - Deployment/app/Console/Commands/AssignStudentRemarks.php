<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Users\Models\User;

class AssignStudentRemarks extends Command
{
    protected $signature = 'students:assign-remarks';
    protected $description = 'Assign remarks to students based on their grades and curriculum.';

    public function handle()
    {
        $majorPrefixes = ['CPE', 'EE', 'CE', 'ECE'];
        $techPrefixes = ['ES', 'MATH', 'PHY'];
        $remarks = [1 => 'Regular', 2 => 'Probationary', 3 => 'Advised to Shift'];
        $students = User::where('roleID', 1)->get();
        $updated = 0;
        foreach ($students as $student) {
            $curriculumRow = DB::table('student_curricula')->where('userID', $student->userID)->first();
            if (!$curriculumRow) continue;
            $curriculumID = $curriculumRow->curriculumID;
            $grades = DB::table('student_grades')->where('userCode', $student->userCode)->get();
            $majorFails = 0;
            $techFails = 0;
            foreach ($grades as $grade) {
                $subjectCode = strtoupper($grade->subjectCode ?? '');
                $finalGrade = $grade->finalGrade;
                $isMajor = false;
                $isTech = false;
                foreach ($majorPrefixes as $prefix) {
                    if (strpos($subjectCode, $prefix) === 0) {
                        $isMajor = true;
                        break;
                    }
                }
                foreach ($techPrefixes as $prefix) {
                    if (strpos($subjectCode, $prefix) === 0) {
                        $isTech = true;
                        break;
                    }
                }
                if ($curriculumID == 2) { // New curriculum
                    if (($isMajor || $isTech) && ($finalGrade === null || $finalGrade === '' || $finalGrade >= 2.6 || $finalGrade == -1 || $finalGrade == -2)) {
                        if ($isMajor) $majorFails++;
                        if ($isTech) $techFails++;
                    }
                } else { // Old curriculum
                    if ($isMajor && ($finalGrade === null || $finalGrade === '' || $finalGrade >= 2.6 || $finalGrade == -1 || $finalGrade == -2)) {
                        $majorFails++;
                    }
                    if ($isTech && ($finalGrade === null || $finalGrade === '' || $finalGrade == 5 || $finalGrade == -1 || $finalGrade == -2)) {
                        $techFails++;
                    }
                }
            }
            $failCount = ($curriculumID == 2) ? ($majorFails + $techFails) : ($majorFails + $techFails);
            if ($failCount >= 2) {
                $remarksID = 3; // Advised to Shift
            } elseif ($failCount == 1) {
                $remarksID = 2; // Probationary
            } else {
                $remarksID = 1; // Regular
            }
            DB::table('student_remarks')->updateOrInsert(
                ['userID' => $student->userID],
                [
                    'remarksID' => $remarksID,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $updated++;
        }
        $this->info("Assigned remarks for $updated students.");
        return 0;
    }
} 