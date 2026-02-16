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
        Schema::create('class_personal_quizzes', function (Blueprint $table) {
            $table->id('classPersonalQuizID');
            $table->foreignId('classID')
                ->constrained('classes', 'classID')
                ->onDelete('cascade');
            $table->foreignId('personalQuizID')
                ->constrained('personal_quizzes', 'personalQuizID')
                ->onDelete('cascade');
            $table->dateTime('startDate')->nullable(); // When quiz becomes available
            $table->dateTime('deadlineDate')->nullable(); // When quiz expires
            $table->timestamps();

            // Ensure a quiz can only be assigned once per class
            $table->unique(['classID', 'personalQuizID'], 'unique_class_quiz');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_personal_quizzes');
    }
};

