<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-question outcomes for each student_quiz_results row.
     * Supports analytics: weak subjects (via subjectID), weak questions (via bank_questionID / personalQuizQuestionID).
     */
    public function up(): void
    {
        Schema::create('student_quiz_answer_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_quiz_result_id')
                ->constrained('student_quiz_results', 'id')
                ->cascadeOnDelete();

            $table->foreignId('studentID')
                ->constrained('users', 'userID')
                ->cascadeOnDelete();

            $table->foreignId('personalQuizQuestionID')
                ->constrained('personal_quiz_questions', 'personalQuizQuestionID')
                ->cascadeOnDelete();

            /** Links to bank question when this personal question was copied from the item bank */
            $table->unsignedBigInteger('bank_questionID')->nullable();
            $table->foreign('bank_questionID')
                ->references('questionID')
                ->on('questions')
                ->nullOnDelete();

            /** Denormalized at submit time for fast aggregates (weak-by-subject queries) */
            $table->foreignId('subjectID')
                ->nullable()
                ->constrained('subjects', 'subjectID')
                ->nullOnDelete();

            $table->unsignedBigInteger('selected_personalQuizChoiceID')->nullable();
            $table->foreign('selected_personalQuizChoiceID', 'sqad_selected_choice_fk')
                ->references('personalQuizChoiceID')
                ->on('personal_quiz_choices')
                ->nullOnDelete();

            $table->boolean('is_correct')->default(false);
            $table->decimal('points_possible', 10, 2)->default(0);
            $table->decimal('points_earned', 10, 2)->default(0);

            /** Immutable copy of labels at submit (optional; for audit if bank text changes) */
            $table->json('question_snapshot')->nullable();

            $table->timestamps();

            $table->unique(
                ['student_quiz_result_id', 'personalQuizQuestionID'],
                'uniq_student_quiz_result_question'
            );
            $table->index(['studentID', 'subjectID'], 'sqad_student_subject_idx');
            $table->index('bank_questionID', 'sqad_bank_question_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_quiz_answer_details');
    }
};
