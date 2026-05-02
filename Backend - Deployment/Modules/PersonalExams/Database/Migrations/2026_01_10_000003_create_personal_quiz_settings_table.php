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
        Schema::create('class_personal_quiz_settings', function (Blueprint $table) {
            $table->id('personalQuizSettingID');
            $table->unsignedBigInteger('classPersonalQuizID')->unique();

            // Scheduling
            $table->dateTime('startTime')->nullable();
            $table->dateTime('endTime')->nullable();

            // Attempts
            $table->integer('quizAttempts')->nullable();

            // Timer
            $table->integer('quizTimer')->nullable();
            $table->boolean('quizTimerEnabled')->default(false);

            // Behaviour
            $table->boolean('shuffleQuestions')->default(false);
            $table->boolean('shuffleChoices')->default(false);
            $table->boolean('showCorrectAnswers')->default(false);
            $table->boolean('showCorrectQuestion')->default(false);
            $table->boolean('autoSubmitOnTimeout')->default(false);
            $table->boolean('allowLateSubmission')->default(false);
            $table->boolean('showScoreAfterQuiz')->default(false);

            // Legacy fields for backward compatibility (not used, but kept for code consistency)
            $table->boolean('enableTimer')->default(false);
            $table->integer('duration_minutes')->nullable();

            $table->timestamps();

            $table->foreign('classPersonalQuizID')
                ->references('classPersonalQuizID')
                ->on('class_personal_quizzes')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_personal_quiz_settings');
    }
};

