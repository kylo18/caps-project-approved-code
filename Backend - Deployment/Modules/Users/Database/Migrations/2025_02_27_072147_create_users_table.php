<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('userID');
            $table->string('userCode', 20)->unique();
            $table->string('firstName', 50);
            $table->string('lastName', 50);
            $table->string('email', 100)->unique();
            $table->string('password');
            $table->unsignedBigInteger('roleID'); // Explicitly define as unsigned big int
            $table->unsignedBigInteger('campusID'); // Explicitly define as unsigned big int
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('status_id')->default(1); // Default to pending (ID: 1)
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('roleID')->references('roleID')->on('roles')->onDelete('cascade');
            $table->foreign('campusID')->references('campusID')->on('campuses')->onDelete('cascade');
            $table->foreign('status_id')->references('id')->on('statuses')->onDelete('cascade');
            // Foreign key to Programs Table
            $table->foreignId('programID')
            ->constrained('programs', 'programID')
            ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};
