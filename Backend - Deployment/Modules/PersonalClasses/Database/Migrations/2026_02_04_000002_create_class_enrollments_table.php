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
        Schema::create('class_enrollments', function (Blueprint $table) {
            $table->id('enrollmentID');
            $table->foreignId('classID')
                ->constrained('classes', 'classID')
                ->onDelete('cascade');
            $table->foreignId('studentID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');
            $table->timestamp('enrolledAt')->useCurrent();
            $table->timestamps();

            // Ensure a student can only be enrolled once per class
            $table->unique(['classID', 'studentID'], 'unique_class_student');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_enrollments');
    }
};

