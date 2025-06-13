<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('userCode', 20)->unique(); // ID number from users table
            $table->string('fullName', 100);
            $table->string('lastName', 50);
            $table->string('firstName_middleName', 100);
            $table->enum('sex', ['MALE', 'FEMALE']);
            $table->unsignedBigInteger('programID');
            $table->integer('yearLevel');
            $table->string('block', 10);
            $table->timestamps();

            // Foreign key to users table
            $table->foreign('userCode')
                ->references('userCode')
                ->on('users')
                ->onDelete('cascade');

            // Foreign key to programs table
            $table->foreign('programID')
                ->references('programID')
                ->on('programs')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('students');
    }
}; 