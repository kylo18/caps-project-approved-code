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
        Schema::create('difficulty_distribution', function (Blueprint $table) {
            $table->id('difficultyDistributionID'); // Primary Key
            $table->foreignId('examSubjectDistributionID')->constrained('exam_subject_distribution', 'examSubjectDistributionID')->onDelete('cascade');
            $table->decimal('easyPercentage', 5, 2); // Percentage for Easy Questions
            $table->decimal('moderatePercentage', 5, 2); // Percentage for Moderate Questions
            $table->decimal('hardPercentage', 5, 2); // Percentage for Hard Questions
            $table->timestamps(); // Created & updated timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('difficulty_distribution');
    }
};
