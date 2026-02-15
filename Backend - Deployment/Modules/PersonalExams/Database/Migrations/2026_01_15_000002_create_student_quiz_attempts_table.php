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
        Schema::create('student_quiz_attempts', function (Blueprint $table) {
            $table->id('attemptID');
            $table->unsignedBigInteger('personalQuizID');
            $table->unsignedBigInteger('studentID');
            $table->integer('attemptNumber')->default(1); // Track which attempt this is (1st, 2nd, etc.)
            $table->timestamp('startedAt')->nullable();
            $table->timestamp('completedAt')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('personalQuizID')
                ->references('personalQuizID')
                ->on('personal_quizzes')
                ->onDelete('cascade');

            $table->foreign('studentID')
                ->references('userID')
                ->on('users')
                ->onDelete('cascade');

            // Ensure unique attempt number per student per quiz
            $table->unique(['personalQuizID', 'studentID', 'attemptNumber'], 'unique_student_quiz_attempt');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_quiz_attempts');
    }
};

