<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create FAQs Table
 * 
 * Purpose: Stores frequently asked questions and answers for user support.
 * Publicly accessible endpoint for self-service help.
 */
return new class extends Migration
{
    /**
     * Run the migrations to create the faqs table.
     */
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Category this FAQ belongs to
            $table->unsignedBigInteger('category_id')->nullable();
            
            // The question
            $table->string('question', 500);
            
            // The answer
            $table->text('answer');
            
            // Display order within category
            $table->unsignedInteger('display_order')->default(0);
            
            // Whether this FAQ is active/visible
            $table->boolean('is_active')->default(true);
            
            // Timestamps
            $table->timestamps();
            
            // Foreign key to categories
            $table->foreign('category_id')
                  ->references('id')
                  ->on('faq_categories')
                  ->onDelete('set null');
            
            // Indexes
            $table->index('category_id', 'idx_faq_category');
            $table->index('is_active', 'idx_faq_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};