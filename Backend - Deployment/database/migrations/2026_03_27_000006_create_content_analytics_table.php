<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_analytics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('interaction_type'); // 'lesson_view', 'quiz_attempt'
            $table->integer('time_spent_seconds')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('subject_id')->references('subjectID')->on('subjects')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_analytics');
    }
};
