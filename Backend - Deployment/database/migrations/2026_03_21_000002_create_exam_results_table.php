<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions', 'questionID')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('coverages')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects', 'subjectID')->onDelete('cascade');
            $table->string('difficulty');
            // difficulty: easy | moderate | hard
            $table->boolean('is_correct')->default(false);
            $table->boolean('is_skipped')->default(false);
            $table->integer('time_spent')->default(0);
            // time_spent is in seconds
            $table->timestamps();

            $table->index(['attempt_id', 'topic_id']);
            $table->index(['attempt_id', 'difficulty']);
            $table->index('question_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};