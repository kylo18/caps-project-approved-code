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
            $table->unsignedBigInteger('sex_id');
            $table->unsignedBigInteger('programID');
            $table->integer('yearLevel');
            $table->string('block', 10);
            $table->timestamps();

            // Foreign key to programs table
            $table->foreign('programID')
                ->references('programID')
                ->on('programs')
                ->onDelete('cascade');

            // Foreign key to sexes table
            $table->foreign('sex_id')
                ->references('id')
                ->on('sexes')
                ->onDelete('restrict');
        });
    }

    public function down()
    {
        Schema::dropIfExists('students');
    }
}; 