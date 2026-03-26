<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_difficulty_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'userID')->onDelete('cascade');
            $table->string('difficulty');
            $table->integer('correct')->default(0);
            $table->integer('total')->default(0);
            $table->decimal('score_pct', 5, 2)->default(0);
            $table->timestamps();

            $table->index(['attempt_id', 'difficulty']);
            $table->unique(['attempt_id', 'difficulty']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_difficulty_analytics');
    }
};