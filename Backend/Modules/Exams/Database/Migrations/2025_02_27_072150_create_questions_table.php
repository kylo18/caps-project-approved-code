<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id('questionID');

            // Foreign Key to Subjects Table
            $table->foreignId('subjectID')
                ->constrained('subjects', 'subjectID')
                ->onDelete('cascade');

            // Foreign Key to Users Table
            $table->foreignId('userID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');

            // Foreign Key to Purposes Table
            $table->text('purpose');

            // Coverage Column
            $table->enum('coverage', ['midterm', 'finals']);

            // Main Question Details
            $table->text('questionText');
            $table->string('image')->nullable();
            $table->integer('score');

            // Difficulty Level
            $table->enum('difficulty', ['easy', 'moderate', 'hard']);

            // Approval Status
            $table->enum('status', ['pending', 'approved', 'disapproved'])->default('pending');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('questions');
    }
};
