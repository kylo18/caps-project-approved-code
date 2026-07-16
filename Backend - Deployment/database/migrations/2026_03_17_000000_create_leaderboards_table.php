<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leaderboards', function (Blueprint $table) {
            // Primary key
            $table->id('leaderboardID');
            
            // Foreign keys
            $table->unsignedBigInteger('userID');
            $table->unsignedBigInteger('subjectID')->nullable();
            
            // Score metrics
            $table->float('highest_percentage')->default(0);
            $table->integer('total_exams')->default(0);
            $table->float('score')->default(0);
            
            // Timestamps
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
            
            // Indexes for performance optimization
            $table->unique(['userID', 'subjectID']); // Ensures one record per user/subject
            $table->index('score'); // Fast top-N sorting
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboards');
    }
};
