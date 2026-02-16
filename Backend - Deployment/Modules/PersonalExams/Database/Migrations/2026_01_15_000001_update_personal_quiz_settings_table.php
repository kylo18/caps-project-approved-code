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
        Schema::table('personal_quiz_settings', function (Blueprint $table) {
            // Add new configuration fields
            $table->dateTime('startTime')->nullable()->after('personalQuizID');
            $table->dateTime('endTime')->nullable()->after('startTime');
            $table->integer('quizAttempts')->nullable()->after('duration_minutes');
            $table->integer('quizTimer')->nullable()->after('quizAttempts'); // Renamed from duration_minutes for consistency
            $table->boolean('quizTimerEnabled')->default(false)->after('quizTimer'); // Renamed from enableTimer
            $table->boolean('shuffleQuestions')->default(false)->after('quizTimerEnabled');
            $table->boolean('shuffleChoices')->default(false)->after('shuffleQuestions');
            $table->boolean('showCorrectAnswers')->default(false)->after('shuffleChoices');
            $table->boolean('autoSubmitOnTimeout')->default(false)->after('showCorrectAnswers');
            $table->boolean('allowLateSubmission')->default(false)->after('autoSubmitOnTimeout');
            $table->boolean('showScoreAfterQuiz')->default(false)->after('allowLateSubmission');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_quiz_settings', function (Blueprint $table) {
            $table->dropColumn([
                'startTime',
                'endTime',
                'quizAttempts',
                'quizTimer',
                'quizTimerEnabled',
                'shuffleQuestions',
                'shuffleChoices',
                'showCorrectAnswers',
                'autoSubmitOnTimeout',
                'allowLateSubmission',
                'showScoreAfterQuiz',
            ]);
        });
    }
};

