<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create FAQ Categories Table
 * 
 * Purpose: Groups FAQs into categories for better organization.
 * Examples: Account, Technical, Academic, Billing
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the faq_categories table.
     */
    public function up(): void
    {
        Schema::create('faq_categories', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Subject matter for categorization
            $table->string('subject', 100);
            
            // Optional description
            $table->text('description')->nullable();
            
            // Display order for sorting
            $table->unsignedInteger('display_order')->default(0);
            
            // Timestamps
            $table->timestamps();
            
            // Index for ordering
            $table->index('display_order', 'idx_display_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faq_categories');
    }
};