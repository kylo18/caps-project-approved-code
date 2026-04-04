<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-question rows for each submitted class quiz attempt.
     * Supports analytics: weak subjects (via subject_id), weak questions, cohort difficulty.
     */
    public function up(): void
    {
        Schema::create('student_quiz_attempt_answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_quiz_result_id')
                ->constrained('student_quiz_results')
                ->cascadeOnDelete();

            $table->foreignId('studentID')
                ->constrained('users', 'userID')
                ->cascadeOnDelete();

            $table->foreignId('class_quiz_assignment_id')
                ->constrained('class_personal_quizzes', 'classPersonalQuizID')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('personal_quiz_question_id');
            $table->foreign('personal_quiz_question_id', 'sqaa_pqq_fk')
                ->references('personalQuizQuestionID')
                ->on('personal_quiz_questions')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('selected_personal_quiz_choice_id')->nullable();
            $table->foreign('selected_personal_quiz_choice_id', 'sqaa_pqc_fk')
                ->references('personalQuizChoiceID')
                ->on('personal_quiz_choices')
                ->nullOnDelete();

            /** Denormalized for analytics (personal quiz question or quiz-level subject). */
            $table->foreignId('subject_id')
                ->nullable()
                ->constrained('subjects', 'subjectID')
                ->nullOnDelete();

            /** Link to main question bank when the personal question was copied from it. */
            $table->foreignId('bank_question_id')
                ->nullable()
                ->constrained('questions', 'questionID')
                ->nullOnDelete();

            $table->boolean('is_correct')->default(false);
            $table->decimal('points_possible', 10, 2)->default(0);
            $table->decimal('points_earned', 10, 2)->default(0);

            /** Plain-text snapshot at submit time (decrypted copy for stable history). */
            $table->json('question_snapshot')->nullable();

            $table->timestamps();

            $table->unique(
                ['student_quiz_result_id', 'personal_quiz_question_id'],
                'unique_result_per_question'
            );

            $table->index(['studentID', 'subject_id'], 'sqaa_student_subject_idx');
            $table->index(['personal_quiz_question_id'], 'sqaa_pqq_idx');
            $table->index(['bank_question_id'], 'sqaa_bank_q_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_quiz_attempt_answers');
    }
};
