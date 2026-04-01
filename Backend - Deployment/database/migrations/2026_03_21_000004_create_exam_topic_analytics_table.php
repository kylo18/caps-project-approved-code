<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_topic_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'userID')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('coverages')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects', 'subjectID')->onDelete('cascade');
            $table->integer('correct')->default(0);
            $table->integer('total')->default(0);
            $table->decimal('score_pct', 5, 2)->default(0);
            $table->boolean('is_weak')->default(false);
            $table->timestamps();

            $table->index(['attempt_id', 'topic_id']);
            $table->index(['user_id', 'is_weak']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_topic_analytics');
    }
};