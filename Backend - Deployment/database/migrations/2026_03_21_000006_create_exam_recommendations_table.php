<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users', 'userID')->onDelete('cascade');
            $table->text('recommendation');
            $table->string('type');
            // type: topic | difficulty | general
            $table->timestamps();

            $table->index(['attempt_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_recommendations');
    }
};