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
        Schema::create('exam_subject_distribution', function (Blueprint $table) {
            $table->id('examSubjectDistributionID'); // Primary Key
            $table->foreignId('examSettingsID')->constrained('exam_settings', 'examSettingsID')->onDelete('cascade');
            $table->foreignId('subjectID')->constrained('subjects', 'subjectID')->onDelete('cascade');
            $table->decimal('percentage', 5, 2); // Percentage allocation for the subject in the exam
            $table->timestamps(); // Created & updated timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_subject_distribution');
    }
};
