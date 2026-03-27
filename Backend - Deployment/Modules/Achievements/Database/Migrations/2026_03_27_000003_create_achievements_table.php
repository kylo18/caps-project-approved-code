<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create Achievements Table
 * 
 * Purpose: Stores the dictionary of available achievements/milestones
 * that students can earn based on their performance.
 * 
 * Achievement Types:
 * - score_threshold: Achieve a specific score percentage
 * - exam_count: Complete a certain number of exams
 * - streak: Maintain consistent performance
 * - subject_mastery: Master all topics in a subject
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the achievements table.
     */
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Achievement name
            $table->string('name', 100)->notNullable();
            
            // Detailed description
            $table->text('description')->nullable();
            
            // Icon identifier (for frontend to display)
            $table->string('icon', 100)->nullable();
            
            // Type of achievement criteria
            $table->enum('criteria_type', [
                'score_threshold', 
                'exam_count', 
                'streak', 
                'subject_mastery',
                'perfect_score'
            ])->notNullable();
            
            // Value required to earn the achievement
            $table->integer('criteria_value')->notNullable();
            
            // Points awarded when earned
            $table->unsignedInteger('points')->default(0);
            
            // Timestamps
            $table->timestamps();
            
            // Index for querying by criteria type
            $table->index('criteria_type', 'idx_criteria_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};