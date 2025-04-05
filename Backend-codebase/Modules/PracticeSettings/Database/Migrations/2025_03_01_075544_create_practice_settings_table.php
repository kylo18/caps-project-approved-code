<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('practice_settings', function (Blueprint $table) {
            $table->id('settingsID'); // Primary Key
            // Define studentID as an unsigned big integer (foreign key)
            $table->unsignedBigInteger('studentID');
            $table->unsignedBigInteger('subjectID');
            $table->boolean('timerEnabled')->default(false);
            $table->json('difficultyDistribution');
            $table->timestamps();

            // Foreign Key Constraints
            $table->foreign('studentID')->references('userCode')->on('users')->onDelete('cascade');
            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_settings');
    }
};
