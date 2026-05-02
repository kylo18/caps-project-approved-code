<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personal_quiz_questions', function (Blueprint $table) {
            $table->id('personalQuizQuestionID');
            $table->unsignedBigInteger('personalQuizID');
            $table->unsignedBigInteger('questionID')->nullable(); // Nullable for manual questions
            
            // Fields matching questions table structure
            $table->foreignId('personalQuizSubjectID')
                ->nullable() // Nullable for custom quizzes
                ->constrained('subjects', 'subjectID')
                ->onDelete('cascade');
            $table->foreignId('personalQuizUserID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');
            $table->text('personalQuizQuestionText');
            $table->string('personalQuizImage')->nullable();
            $table->integer('personalQuizScore');
            $table->foreignId('personalQuizCoverageId')
                ->nullable() // Nullable for custom quizzes
                ->constrained('coverages')
                ->onDelete('cascade');
            
            $table->timestamps();

            $table->foreign('personalQuizID')
                ->references('personalQuizID')
                ->on('personal_quizzes')
                ->onDelete('cascade');

            $table->foreign('questionID')
                ->references('questionID')
                ->on('questions')
                ->onDelete('cascade');

            // Ensure a question is not added twice to the same quiz (when questionID is not null)
            // MySQL allows multiple NULLs in unique constraints
            $table->unique(['personalQuizID', 'questionID'], 'unique_quiz_question');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_quiz_questions');
    }
};


