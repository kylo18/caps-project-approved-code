<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create User Achievements Table
 * 
 * Purpose: Pivot table tracking which achievements each user has earned.
 * Links users to achievements with a timestamp of when earned.
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the user_achievements pivot table.
     */
    public function up(): void
    {
        Schema::create('user_achievements', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Achievement earned
            $table->unsignedBigInteger('achievement_id');
            
            // Student who earned it
            $table->unsignedBigInteger('user_id');
            
            // When the achievement was earned
            $table->timestamp('achieved_at')->useCurrent();
            
            // Timestamps
            $table->timestamps();
            
            // Foreign keys with cascade delete
            $table->foreign('user_id')
                  ->references('userID')
                  ->on('users')
                  ->onDelete('cascade');
                  
            $table->foreign('achievement_id')
                  ->references('id')
                  ->on('achievements')
                  ->onDelete('cascade');
            
            // Unique constraint to prevent duplicate achievements per user
            $table->unique(['user_id', 'achievement_id'], 'unique_user_achievement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_years');
    }
};