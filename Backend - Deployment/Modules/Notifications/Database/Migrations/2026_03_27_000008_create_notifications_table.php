<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create Notifications Table
 * 
 * Purpose: Stores in-app notifications for users including:
 * - Achievement updates and milestones
 * - New lessons available
 * - Quiz results posted
 * - System-wide announcements
 * 
 * Supports read/unread status tracking for UX.
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the notifications table.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // User who receives the notification
            $table->unsignedBigInteger('user_id')->notNullable();
            
            // Type of notification for frontend styling
            $table->enum('type', [
                'achievement', 
                'lesson_available', 
                'quiz_result', 
                'system_announcement',
                'milestone',
                'enrollment'
            ])->notNullable();
            
            // Notification title
            $table->string('title', 255)->notNullable();
            
            // Notification message body
            $table->text('message')->notNullable();
            
            // Optional JSON data for deep linking/actions
            $table->json('data')->nullable();
            
            // Read status flag
            $table->boolean('is_read')->default(false);
            
            // Timestamps
            $table->timestamps();
            
            // Foreign key with cascade delete
            $table->foreign('user_id')
                  ->references('userID')
                  ->on('users')
                  ->onDelete('cascade');
            
            // Indexes for performance
            $table->index(['user_id', 'is_read'], 'idx_user_read');
            $table->index('type', 'idx_notification_type');
            $table->index('created_at', 'idx_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};