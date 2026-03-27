<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create Learning Difficulty Analytics Table
 * 
 * Purpose: Tracks learning difficulty metrics per question including:
 * - Total attempts and correct attempts
 * - Difficulty index calculation
 * - Average attempts before passing
 * - Average time spent per question
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the learning_difficulty_analytics table.
     * This table stores question-level difficulty metrics for educators.
     */
    public function up(): void
    {
        Schema::create('learning_difficulty_analytics', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Question being analyzed
            $table->unsignedBigInteger('question_id')->nullable();
            
            // Subject the question belongs to
            $table->unsignedBigInteger('subject_id')->nullable();
            
            // Attempt statistics
            $table->integer('total_attempts')->default(0);
            $table->integer('correct_attempts')->default(0);
            $table->decimal('average_attempts', 5, 2)->default(0);
            
            // Difficulty index (0.0 - 1.0, higher = more difficult)
            $table->decimal('difficulty_index', 3, 2)->default(0);
            
            // Average time spent in seconds
            $table->integer('average_time_seconds')->default(0);
            
            // Track when metrics were last updated
            $table->timestamp('updated_at')->useCurrentOnUpdate();
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign keys
            $table->foreign('question_id')
                  ->references('questionID')
                  ->on('questions')
                  ->onDelete('cascade');
                  
            $table->foreign('subject_id')
                  ->references('subjectID')
                  ->on('subjects')
                  ->onDelete('cascade');
            
            // Indexes for analytics queries
            $table->index('difficulty_index', 'idx_difficulty');
            $table->index('subject_id', 'idx_subject');
        });
    }

    /**
     * Reverse the migrations by dropping the table.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_difficulty_analytics');
    }
};