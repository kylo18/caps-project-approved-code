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
        Schema::create('student_quiz_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_quiz_assignment_id')
                ->constrained('class_personal_quizzes', 'classPersonalQuizID')
                ->onDelete('cascade');
            $table->foreignId('studentID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');
            
            // Scores
            $table->decimal('score', 10, 2)->default(0);
            $table->decimal('total_score', 10, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            
            // Attempts
            $table->integer('attempt_number')->default(1);
            
            // Timing
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->integer('time_taken_seconds')->nullable();
            
            // Recording
            $table->boolean('isRecorded')->default(false);
            $table->boolean('isPassed')->default(false);
            
            $table->timestamps();
            
            // Ensure unique attempt per student per quiz assignment
            $table->unique(['class_quiz_assignment_id', 'studentID', 'attempt_number'], 'unique_student_quiz_attempt');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_quiz_results');
    }
};



