<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('practice_exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subjectID')->constrained('subjects', 'subjectID')->onDelete('cascade');
            $table->foreignId('createdBy')->constrained('users', 'userID')->onDelete('cascade');
            $table->enum('coverage', ['midterm', 'finals']);
            $table->unsignedInteger('numItems');
            $table->foreignId('difficultyDistributionID')->nullable()->constrained('difficulty_distribution', 'difficultyDistributionID')->onDelete('set null');
            $table->unsignedTinyInteger('easyPercentage');
            $table->unsignedTinyInteger('moderatePercentage');
            $table->unsignedTinyInteger('hardPercentage');
            $table->enum('status', ['pending', 'approved', 'disapproved'])->default('pending');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('practice_exams');
    }
};
