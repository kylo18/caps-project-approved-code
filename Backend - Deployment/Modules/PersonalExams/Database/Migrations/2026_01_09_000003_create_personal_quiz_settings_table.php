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
        Schema::create('personal_quiz_settings', function (Blueprint $table) {
            $table->id('personalQuizSettingID');
            $table->unsignedBigInteger('personalQuizID')->unique();
            $table->boolean('enableTimer')->default(false);
            $table->integer('duration_minutes')->nullable();
            $table->timestamps();

            $table->foreign('personalQuizID')
                ->references('personalQuizID')
                ->on('personal_quizzes')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_quiz_settings');
    }
};

