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
        Schema::create('user_feedback', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('userID')->on('users')->onDelete('cascade');
            $table->string('subject');
            $table->string('issue_type');
            $table->text('message');
            $table->string('category')->nullable(); // Minor/Major/Critical
            $table->string('status')->default('New'); // New/In Progress/Resolved
            $table->timestamps();
            
            // Indexes for performance
            $table->index('user_id');
            $table->index('subject');
            $table->index('issue_type');
            $table->index('status');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_feedback');
    }
};
