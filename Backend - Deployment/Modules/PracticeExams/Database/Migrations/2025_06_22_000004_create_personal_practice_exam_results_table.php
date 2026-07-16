<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('personal_practice_exam_results', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('subjectID');
            $table->unsignedBigInteger('teacher_id');
            $table->integer('totalPoints');
            $table->integer('earnedPoints');
            $table->float('percentage');
            $table->timestamps();

            $table->foreign('student_id')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_id')->references('userID')->on('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('personal_practice_exam_results');
    }
}; 