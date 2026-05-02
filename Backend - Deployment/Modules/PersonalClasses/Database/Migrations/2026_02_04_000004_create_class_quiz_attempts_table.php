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
        Schema::create('class_quiz_attempts', function (Blueprint $table) {
            $table->id('attemptID');
            $table->foreignId('classID')
                ->constrained('classes', 'classID')
                ->onDelete('cascade');
            $table->foreignId('personalQuizID')
                ->constrained('personal_quizzes', 'personalQuizID')
                ->onDelete('cascade');
            $table->foreignId('studentID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');
            $table->decimal('score', 5, 2)->default(0); // Score achieved
            $table->decimal('totalScore', 5, 2)->default(0); // Total possible score
            $table->decimal('accuracy', 5, 2)->default(0); // Percentage accuracy
            $table->boolean('isCompleted')->default(false); // Whether quiz was completed
            $table->timestamp('startedAt')->nullable(); // When student started
            $table->timestamp('completedAt')->nullable(); // When student completed
            $table->timestamps();

            // Ensure a student can only attempt a quiz once per class
            $table->unique(['classID', 'personalQuizID', 'studentID'], 'unique_class_quiz_student');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_quiz_attempts');
    }
};

