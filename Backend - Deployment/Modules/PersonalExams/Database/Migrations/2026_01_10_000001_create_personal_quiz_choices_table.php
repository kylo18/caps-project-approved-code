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
        Schema::create('personal_quiz_choices', function (Blueprint $table) {
            $table->id('personalQuizChoiceID');
            $table->unsignedBigInteger('personalQuizQuestionID');
            $table->text('choiceText')->nullable();
            $table->boolean('isCorrect')->default(false);
            $table->string('image')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->foreign('personalQuizQuestionID')
                ->references('personalQuizQuestionID')
                ->on('personal_quiz_questions')
                ->onDelete('cascade');

            // Ensure position uniqueness per question
            $table->unique(['personalQuizQuestionID', 'position'], 'unique_question_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_quiz_choices');
    }
};

