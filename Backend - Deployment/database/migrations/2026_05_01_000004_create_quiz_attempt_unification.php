<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    public function up(): void
    {
        $hasStudentAttempts = Schema::hasTable('student_quiz_attempts');
        $hasClassAttempts = Schema::hasTable('class_quiz_attempts');

        if (!$hasStudentAttempts && !$hasClassAttempts) {
            Log::info('M4: No quiz attempt tables found, skipping.');
            return;
        }

        if (!Schema::hasTable('quiz_attempts')) {
            Schema::create('quiz_attempts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('personal_quiz_id');
                $table->unsignedBigInteger('class_id')->nullable();
                $table->unsignedInteger('attempt_number')->default(1);
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->string('status', 20)->default('in_progress');
                $table->timestamps();

                $table->foreign('user_id')->references('userID')->on('users')->onDelete('cascade');
                $table->foreign('personal_quiz_id')->references('personalQuizID')->on('personal_quizzes')->onDelete('cascade');
                $table->foreign('class_id')->references('classID')->on('classes')->onDelete('cascade');

                $table->unique(['user_id', 'personal_quiz_id', 'attempt_number'], 'unique_user_quiz_attempt');
                $table->index(['user_id', 'personal_quiz_id']);
                $table->index('status');
            });
        }

        if ($hasStudentAttempts && Schema::hasColumn('student_quiz_attempts', 'personalQuizID')) {
            $studentAttempts = DB::table('student_quiz_attempts')->get();
            foreach ($studentAttempts as $row) {
                DB::table('quiz_attempts')->insert([
                    'user_id' => $row->studentID ?? $row->user_id ?? 0,
                    'personal_quiz_id' => $row->personalQuizID,
                    'class_id' => null,
                    'attempt_number' => $row->attemptNumber ?? 1,
                    'started_at' => $row->startedAt ?? null,
                    'completed_at' => $row->completedAt ?? null,
                    'status' => $row->status ?? 'in_progress',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            Log::info("M4: Migrated {$studentAttempts->count()} student_quiz_attempts rows");
        }

        if ($hasClassAttempts && Schema::hasColumn('class_quiz_attempts', 'classID')) {
            $classAttempts = DB::table('class_quiz_attempts')->get();
            $migrated = 0;
            foreach ($classAttempts as $row) {
                $exists = DB::table('quiz_attempts')
                    ->where('user_id', $row->studentID ?? $row->user_id ?? 0)
                    ->where('personal_quiz_id', $row->personalQuizID)
                    ->where('class_id', $row->classID)
                    ->exists();

                if (!$exists) {
                    DB::table('quiz_attempts')->insert([
                        'user_id' => $row->studentID ?? $row->user_id ?? 0,
                        'personal_quiz_id' => $row->personalQuizID,
                        'class_id' => $row->classID,
                        'attempt_number' => 1,
                        'started_at' => $row->startedAt ?? null,
                        'completed_at' => $row->completedAt ?? null,
                        'status' => $row->isCompleted ? 'completed' : 'in_progress',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $migrated++;
                }
            }
            Log::info("M4: Migrated {$migrated} class_quiz_attempts rows");
        }

        if ($hasStudentAttempts) {
            Schema::table('student_quiz_attempts', function (Blueprint $table) {
                if (!Schema::hasColumn('student_quiz_attempts', 'quiz_attempt_id')) {
                    $table->unsignedBigInteger('quiz_attempt_id')->nullable()->after('studentID');
                    $table->foreign('quiz_attempt_id')->references('id')->on('quiz_attempts')->onDelete('set null');
                    $table->index('quiz_attempt_id');
                }
            });
        }

        if ($hasClassAttempts) {
            Schema::table('class_quiz_attempts', function (Blueprint $table) {
                if (!Schema::hasColumn('class_quiz_attempts', 'quiz_attempt_id')) {
                    $table->unsignedBigInteger('quiz_attempt_id')->nullable()->after('studentID');
                    $table->foreign('quiz_attempt_id')->references('id')->on('quiz_attempts')->onDelete('set null');
                    $table->index('quiz_attempt_id');
                }
            });
        }

        Log::info('M4: Quiz attempt unification complete');
    }

    public function down(): void
    {
        if (Schema::hasColumn('student_quiz_attempts', 'quiz_attempt_id')) {
            Schema::table('student_quiz_attempts', function (Blueprint $table) {
                $table->dropForeign(['quiz_attempt_id']);
                $table->dropColumn('quiz_attempt_id');
            });
        }

        if (Schema::hasColumn('class_quiz_attempts', 'quiz_attempt_id')) {
            Schema::table('class_quiz_attempts', function (Blueprint $table) {
                $table->dropForeign(['quiz_attempt_id']);
                $table->dropColumn('quiz_attempt_id');
            });
        }

        Schema::dropIfExists('quiz_attempts');
    }
};