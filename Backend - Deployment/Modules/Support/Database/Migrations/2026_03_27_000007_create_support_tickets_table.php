<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create Support Tickets Table
 * 
 * Purpose: Stores user support requests/tickets for tracking and resolution.
 * Allows users to report issues and admins to manage/resolve them.
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the support_tickets table.
     */
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // User who created the ticket
            $table->unsignedBigInteger('user_id');
            
            // Ticket subject/title
            $table->string('subject', 255);
            
            // Detailed description of the issue
            $table->text('description');
            
            // Category of the issue
            $table->enum('category', [
                'technical', 
                'account', 
                'academic', 
                'other'
            ])->default('other');
            
            // Current status of the ticket
            $table->enum('status', [
                'open', 
                'in_progress', 
                'resolved', 
                'closed'
            ])->default('open');
            
            // Priority level
            $table->enum('priority', [
                'low', 
                'medium', 
                'high'
            ])->default('medium');
            
            // File attachment path (if any)
            $table->string('attachment_path', 500)->nullable();
            
            // Admin who resolved the ticket
            $table->unsignedBigInteger('resolved_by')->nullable();
            
            // When the ticket was resolved
            $table->timestamp('resolved_at')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Foreign keys with cascade delete
            $table->foreign('user_id')
                  ->references('userID')
                  ->on('users')
                  ->onDelete('cascade');
                  
            $table->foreign('resolved_by')
                  ->references('userID')
                  ->on('users')
                  ->onDelete('set null');
            
            // Indexes for filtering
            $table->index(['user_id', 'status'], 'idx_user_status');
            $table->index('status', 'idx_ticket_status');
            $table->index('priority', 'idx_ticket_priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};