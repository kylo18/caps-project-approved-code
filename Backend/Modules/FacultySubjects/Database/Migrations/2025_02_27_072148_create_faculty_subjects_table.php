<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('faculty_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facultyID')->constrained('users', 'userID')->onDelete('cascade');
            $table->foreignId('subjectID')->constrained('subjects', 'subjectID')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_subjects');
    }
};
