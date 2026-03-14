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
        Schema::create('classes', function (Blueprint $table) {
            $table->id('classID');
            $table->foreignId('facultyID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');
            $table->foreignId('subjectID')
                ->constrained('subjects', 'subjectID')
                ->onDelete('cascade');
            $table->string('className'); // e.g., "CE101 - Section A"
            $table->string('classCode')->unique(); // join code (e.g., "ABC123")
            $table->string('inviteToken')->unique()->nullable(); // Unique token for invite link
            $table->string('inviteLink')->nullable(); // Generated unique link
            $table->text('description')->nullable();
            $table->text('schedule')->nullable(); // Class schedule information
            $table->boolean('isActive')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};

