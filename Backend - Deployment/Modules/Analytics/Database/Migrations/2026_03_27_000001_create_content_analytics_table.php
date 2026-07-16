<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create Content Analytics Table
 * 
 * Purpose: Tracks student interactions with learning content including:
 * - Lesson views
 * - Quiz attempts
 * - Time spent on topics
 * - Questions viewed/skipped
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the content_analytics table.
     * This table stores user interaction data for content analytics.
     */
    public function up(): void
    {
        Schema::create('content_analytics', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // User who performed the interaction
            $table->unsignedBigInteger('user_id')->nullable();
            
            // Subject/topic being interacted with
            $table->unsignedBigInteger('subject_id')->nullable();
            
            // Specific question (nullable for lesson views)
            $table->unsignedBigInteger('question_id')->nullable();
            
            // Type of interaction
            $table->enum('interaction_type', [
                'lesson_view', 
                'quiz_attempt', 
                'question_view', 
                'question_skip',
                'lesson_complete'
            ])->default('lesson_view');
            
            // Time spent in seconds
            $table->integer('time_spent_seconds')->default(0);
            
            // Timestamp of interaction
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign keys with cascade delete
            $table->foreign('user_id')
                  ->references('userID')
                  ->on('users')
                  ->onDelete('cascade');
                  
            $table->foreign('subject_id')
                  ->references('subjectID')
                  ->on('subjects')
                  ->onDelete('cascade');
                  
            $table->foreign('question_id')
                  ->references('questionID')
                  ->on('questions')
                  ->onDelete('set null');
            
            // Indexes for performance optimization
            $table->index(['user_id', 'subject_id'], 'idx_user_subject');
            $table->index('interaction_type', 'idx_interaction_type');
            $table->index('created_at', 'idx_created_at');
        });
    }

    /**
     * Reverse the migrations by dropping the content_analytics table.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_analytics');
    }
};