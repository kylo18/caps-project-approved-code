<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds data into tables that are structurally complete
 * but have zero rows after the main seed chain.
 * This covers: classes, enrollments, personal quizzes,
 * faculty assignments, student records, and practice results.
 */
class PopulateEmptyTablesSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedFacultySubjects();
        $this->seedStudentCurricula();
        $this->seedStudentRemarks();
        $this->seedStudentGrades();
        $this->seedStudentTeacherEnrollments();
        $this->seedPersonalExamSettings();
        $this->seedPersonalPracticeExamResults();
        $this->seedClassesAndEnrollments();
        $this->seedPersonalQuizzes();
        $this->seedPracticeExamDrafts();
    }

    // ── Faculty-Subject assignments ──────────────────────────────────────

    private function seedFacultySubjects(): void
    {
        if (DB::table('faculty_subjects')->count() > 0) {
            $this->command->info('faculty_subjects already seeded.');
            return;
        }

        $faculty = DB::table('users')->where('roleID', 2)->limit(5)->get();
        $subjects = DB::table('subjects')->get();

        if ($faculty->isEmpty() || $subjects->isEmpty()) return;

        $rows = [];
        $i = 0;
        foreach ($faculty as $f) {
            // Each faculty teaches 2-3 subjects
            $assigned = $subjects->random(min(3, $subjects->count()));
            foreach ($assigned as $s) {
                $rows[] = [
                    'facultyID'    => $f->userID,
                    'subjectID'    => $s->subjectID,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ];
                $i++;
            }
        }

        if (!empty($rows)) {
            DB::table('faculty_subjects')->insert($rows);
        }
        $this->command->info("✅ faculty_subjects: {$i} assignments seeded.");
    }

    // ── Student Curricula ────────────────────────────────────────────────

    private function seedStudentCurricula(): void
    {
        if (DB::table('student_curricula')->count() > 0) {
            $this->command->info('student_curricula already seeded.');
            return;
        }

        $students = DB::table('users')->where('roleID', 1)->limit(20)->get();
        $curricula = DB::table('curriculum')->pluck('id')->toArray();

        if ($students->isEmpty() || empty($curricula)) return;

        $rows = [];
        foreach ($students as $s) {
            $rows[] = [
                'userID'       => $s->userID,
                'curriculumID' => $curricula[array_rand($curricula)],
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        DB::table('student_curricula')->insert($rows);
        $this->command->info("✅ student_curricula: " . count($rows) . " records seeded.");
    }

    // ── Student Remarks ─────────────────────────────────────────────────

    private function seedStudentRemarks(): void
    {
        if (DB::table('student_remarks')->count() > 0) {
            $this->command->info('student_remarks already seeded.');
            return;
        }

        $remarksTypes = DB::table('remarks')->pluck('id')->toArray();
        if (empty($remarksTypes)) return;

        $students = DB::table('users')->where('roleID', 1)->limit(15)->get();
        if ($students->isEmpty()) return;

        $rows = [];
        foreach ($students as $s) {
            $rows[] = [
                'userID'     => $s->userID,
                'remarksID'  => $remarksTypes[array_rand($remarksTypes)],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('student_remarks')->insert($rows);
        $this->command->info("✅ student_remarks: " . count($rows) . " records seeded.");
    }

    // ── Student Grades ──────────────────────────────────────────────────

    private function seedStudentGrades(): void
    {
        if (DB::table('student_grades')->count() > 0) {
            $this->command->info('student_grades already seeded.');
            return;
        }

        $students = DB::table('students')->limit(10)->get();
        $subjects = DB::table('subjects')->limit(5)->get();

        if ($students->isEmpty() || $subjects->isEmpty()) return;

        $rows = [];
        foreach ($students as $s) {
            foreach ($subjects as $subj) {
                $rows[] = [
                    'user_id'       => null,
                    'student_id'    => $s->id,
                    'subject_id'    => $subj->subjectID,
                    'subjectDesc'  => $subj->subjectName ?? $subj->subjectCode ?? 'N/A',
                    'genAve'        => rand(75, 95) + 0.00,
                    'reEx'          => null,
                    'finalGrade'    => rand(75, 95) + 0.00,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ];
            }
        }

        DB::table('student_grades')->insert($rows);
        $this->command->info("✅ student_grades: " . count($rows) . " records seeded.");
    }

    // ── Student-Teacher Enrollments ──────────────────────────────────────

    private function seedStudentTeacherEnrollments(): void
    {
        if (DB::table('student_teacher_enrollments')->count() > 0) {
            $this->command->info('student_teacher_enrollments already seeded.');
            return;
        }

        $students = DB::table('users')->where('roleID', 1)->limit(10)->pluck('userID')->toArray();
        $teachers = DB::table('users')->where('roleID', 2)->limit(5)->pluck('userID')->toArray();

        if (empty($students) || empty($teachers)) return;

        $rows = [];
        foreach ($students as $sid) {
            $rows[] = [
                'student_id' => $sid,
                'teacher_id' => $teachers[array_rand($teachers)],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('student_teacher_enrollments')->insert($rows);
        $this->command->info("✅ student_teacher_enrollments: " . count($rows) . " records seeded.");
    }

    // ── Personal Exam Settings ───────────────────────────────────────────

    private function seedPersonalExamSettings(): void
    {
        if (DB::table('personal_exam_settings')->count() > 0) {
            $this->command->info('personal_exam_settings already seeded.');
            return;
        }

        $subjects = DB::table('subjects')->limit(5)->get();
        $users = DB::table('users')->where('roleID', 2)->limit(3)->get();

        if ($subjects->isEmpty() || $users->isEmpty()) return;

        $rows = [];
        foreach ($subjects as $s) {
            foreach ($users as $u) {
                $rows[] = [
                    'subjectID'           => $s->subjectID,
                    'isEnabled'           => true,
                    'enableTimer'         => rand(0, 1),
                    'duration_minutes'    => rand(30, 120),
                    'coverage'            => ['midterm', 'finals', 'full'][array_rand(['midterm', 'finals', 'full'])],
                    'easy_percentage'     => 40,
                    'moderate_percentage' => 40,
                    'hard_percentage'     => 20,
                    'total_items'         => 50,
                    'createdBy'           => $u->userID,
                    'purpose_id'          => 2,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ];
            }
        }

        DB::table('personal_exam_settings')->insert($rows);
        $this->command->info("✅ personal_exam_settings: " . count($rows) . " records seeded.");
    }

    // ── Personal Practice Exam Results ────────────────────────────────────

    private function seedPersonalPracticeExamResults(): void
    {
        if (DB::table('personal_practice_exam_results')->count() > 0) {
            $this->command->info('personal_practice_exam_results already seeded.');
            return;
        }

        $students = DB::table('users')->where('roleID', 1)->limit(10)->pluck('userID')->toArray();
        $teachers = DB::table('users')->where('roleID', 2)->limit(3)->pluck('userID')->toArray();
        $subjects = DB::table('subjects')->limit(5)->pluck('subjectID')->toArray();

        if (empty($students) || empty($subjects)) return;

        $rows = [];
        foreach ($students as $sid) {
            foreach ($subjects as $subjId) {
                $pct = rand(45, 98);
                $rows[] = [
                    'student_id'   => $sid,
                    'subjectID'    => $subjId,
                    'teacher_id'   => !empty($teachers) ? $teachers[array_rand($teachers)] : null,
                    'totalPoints'  => 100,
                    'earnedPoints' => $pct,
                    'percentage'   => $pct,
                    'created_at'   => now()->subDays(rand(1, 30)),
                    'updated_at'   => now(),
                ];
            }
        }

        DB::table('personal_practice_exam_results')->insert($rows);
        $this->command->info("✅ personal_practice_exam_results: " . count($rows) . " records seeded.");
    }

    // ── Classes & Enrollments ────────────────────────────────────────────

    private function seedClassesAndEnrollments(): void
    {
        if (DB::table('classes')->count() > 0) {
            $this->command->info('classes already seeded.');
            return;
        }

        $faculty = DB::table('users')->where('roleID', 2)->limit(3)->get();
        $subjects = DB::table('subjects')->limit(6)->get();

        if ($faculty->isEmpty() || $subjects->isEmpty()) return;

        $classNames = ['Section A', 'Section B', 'Block C'];
        $classRows = [];
        foreach ($faculty as $fi => $f) {
            $subj = $subjects->get($fi);
            $code = strtoupper(substr($subj->subjectCode ?? 'GEN', 0, 4)) . '-' . rand(100, 999);
            $token = bin2hex(random_bytes(8));
            $classRows[] = [
                'facultyID'   => $f->userID,
                'subjectID'   => $subj->subjectID,
                'className'   => $classNames[$fi],
                'classCode'   => $code,
                'inviteToken' => $token,
                'inviteLink'  => "caps://join/{$token}",
                'description' => "{$subj->subjectName} — {$classNames[$fi]}",
                'schedule'    => 'MWF 8:00-9:00 AM',
                'isActive'    => true,
                'created_at'  => now(),
                'updated_at'  => now(),
            ];
        }

        DB::table('classes')->insert($classRows);
        $classIds = DB::table('classes')->pluck('classID')->toArray();

        // Enroll 5-8 students per class
        $students = DB::table('users')->where('roleID', 1)->limit(20)->pluck('userID')->toArray();
        $enrollRows = [];
        foreach ($classIds as $cid) {
            $enrolled = [];
            $count = min(rand(5, 8), count($students));
            $keys = array_rand($students, $count);
            if (!is_array($keys)) $keys = [$keys];
            foreach ($keys as $k) {
                $enrolled[] = $students[$k];
                $enrollRows[] = [
                    'classID'    => $cid,
                    'studentID'  => $students[$k],
                    'enrolledAt' => now()->subDays(rand(5, 30)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('class_enrollments')->insert($enrollRows);
        $this->command->info("✅ classes: " . count($classRows) . " classes, " . count($enrollRows) . " enrollments seeded.");
    }

    // ── Personal Quizzes + Questions + Choices ───────────────────────────

    private function seedPersonalQuizzes(): void
    {
        if (DB::table('personal_quizzes')->count() > 0) {
            $this->command->info('personal_quizzes already seeded.');
            return;
        }

        $classes = DB::table('classes')->get();
        $faculty = DB::table('users')->where('roleID', 2)->limit(3)->get();
        $subjects = DB::table('subjects')->limit(5)->get();
        $quizTypes = DB::table('quiz_types')->pluck('id')->toArray();
        $coverages = DB::table('coverages')->pluck('id')->toArray();

        if ($faculty->isEmpty() || $subjects->isEmpty()) return;
        if (empty($quizTypes)) $quizTypes = [1];
        if (empty($coverages)) $coverages = [1];

        // Create 2 quizzes per faculty
        foreach ($faculty as $fi => $f) {
            $subj = $subjects->get($fi % $subjects->count());
            $quizId = DB::table('personal_quizzes')->insertGetId([
                'title'         => "{$subj->subjectName} Quiz " . ($fi + 1),
                'description'   => "Assessment on {$subj->subjectName} topics.",
                'instruction'   => 'Answer all questions carefully.',
                'quiz_type_id'  => $quizTypes[0],
                'subjectID'     => $subj->subjectID,
                'coverage_id'   => $coverages[0],
                'created_by'    => $f->userID,
                'isArchived'    => false,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Assign to a class if any exist
            if (!$classes->isEmpty()) {
                $classId = $classes->get($fi % $classes->count())->classID;
                $cpqId = DB::table('class_personal_quizzes')->insertGetId([
                    'classID'         => $classId,
                    'personalQuizID'  => $quizId,
                    'startDate'       => now()->subDays(7),
                    'deadlineDate'    => now()->addDays(7),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);

                // Quiz settings
                DB::table('class_personal_quiz_settings')->insert([
                    'classPersonalQuizID' => $cpqId,
                    'startTime'           => now()->subDays(7),
                    'endTime'             => now()->addDays(7),
                    'quizAttempts'        => 2,
                    'quizTimer'           => 60,
                    'quizTimerEnabled'    => true,
                    'shuffleQuestions'    => true,
                    'shuffleChoices'      => true,
                    'showCorrectAnswers'  => true,
                    'showCorrectQuestion' => true,
                    'autoSubmitOnTimeout' => true,
                    'allowLateSubmission' => false,
                    'showScoreAfterQuiz'  => true,
                    'enableTimer'         => true,
                    'duration_minutes'    => 60,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);
            }

            // 5 questions per quiz
            $questions = DB::table('questions')
                ->where('subjectID', $subj->subjectID)
                ->limit(5)
                ->get();

            foreach ($questions as $qi => $q) {
                $pqId = DB::table('personal_quiz_questions')->insertGetId([
                    'personalQuizID'           => $quizId,
                    'questionID'               => $q->questionID,
                    'personalQuizSubjectID'    => $subj->subjectID,
                    'personalQuizUserID'       => $f->userID,
                    'personalQuizQuestionText' => $q->questionText,
                    'personalQuizImage'        => null,
                    'personalQuizScore'        => $q->score,
                    'personalQuizCoverageId'   => $q->coverage_id,
                    'created_at'               => now(),
                    'updated_at'               => now(),
                ]);

                // 5 choices per question (copy from original)
                $choices = DB::table('choices')
                    ->where('questionID', $q->questionID)
                    ->limit(5)
                    ->get();

                foreach ($choices as $ci => $c) {
                    DB::table('personal_quiz_choices')->insert([
                        'personalQuizQuestionID' => $pqId,
                        'choiceText'             => $c->choiceText,
                        'image'                  => null,
                        'isCorrect'              => $c->isCorrect,
                        'position'               => $c->position,
                        'created_at'             => now(),
                        'updated_at'             => now(),
                    ]);
                }
            }
        }

        $quizCount = DB::table('personal_quizzes')->count();
        $questionCount = DB::table('personal_quiz_questions')->count();
        $choiceCount = DB::table('personal_quiz_choices')->count();
        $this->command->info("✅ personal_quizzes: {$quizCount} quizzes, {$questionCount} questions, {$choiceCount} choices seeded.");
    }

    // ── Practice Exam Drafts ─────────────────────────────────────────────

    private function seedPracticeExamDrafts(): void
    {
        if (DB::table('practice_exam_drafts')->count() > 0) {
            $this->command->info('practice_exam_drafts already seeded.');
            return;
        }

        $students = DB::table('users')->where('roleID', 1)->limit(3)->pluck('userID')->toArray();
        $subjects = DB::table('subjects')->limit(3)->pluck('subjectID')->toArray();

        if (empty($students) || empty($subjects)) return;

        $rows = [];
        foreach ($students as $sid) {
            $subjId = $subjects[array_rand($subjects)];
            $rows[] = [
                'userID'     => $sid,
                'subjectID'  => $subjId,
                'questions'  => json_encode([1, 2, 3, 4, 5]),
                'answers'    => null,
                'time_left'  => rand(600, 3600),
                'started_at' => now()->subHours(rand(1, 24)),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('practice_exam_drafts')->insert($rows);
        $this->command->info("✅ practice_exam_drafts: " . count($rows) . " drafts seeded.");
    }
}
