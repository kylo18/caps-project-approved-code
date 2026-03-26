<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'userID')->onDelete('cascade');
            $table->decimal('overall_score', 5, 2)->default(0);
            $table->integer('rank')->nullable();
            $table->integer('total_candidates')->nullable();
            $table->decimal('percentile', 5, 2)->nullable();
            $table->decimal('improvement_pct', 6, 2)->nullable();
            $table->boolean('has_weak_topics')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'attempt_id']);
            $table->index('overall_score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_analytics');
    }
};