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
        Schema::create('practice_exam_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('result_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('question_id');
            $table->unsignedBigInteger('selected_choice_id')->nullable();
            $table->boolean('is_correct');
            $table->timestamps();

            // Foreign keys
            $table->foreign('result_id')->references('resultID')->on('practice_exam_results')->onDelete('cascade');
            $table->foreign('user_id')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('question_id')->references('questionID')->on('questions')->onDelete('cascade');
            
            // Optional: foreign key for choices if they have a strict cascade rule, 
            // but since a choice id might be null (skipped question), we leave it as a loose relation or nullable FK
            $table->foreign('selected_choice_id')->references('choiceID')->on('choices')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_exam_answers');
    }
};
