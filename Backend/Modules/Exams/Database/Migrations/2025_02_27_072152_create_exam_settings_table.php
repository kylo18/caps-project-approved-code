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
        Schema::create('exam_settings', function (Blueprint $table) {
            $table->id('examSettingsID'); // Primary key
            $table->foreignId('createdBy')->constrained('users', 'userID')->onDelete('cascade');
            $table->string('examType', 50); // Type of exam
            $table->string('difficulty', 50); // Difficulty level
            $table->timestamps(); // Created & updated timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_settings');
    }
};
