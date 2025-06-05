<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('practice_exam_results', function (Blueprint $table) {
            $table->id('resultID');
            $table->unsignedBigInteger('userID');
            $table->unsignedBigInteger('subjectID');
            $table->integer('totalPoints');
            $table->integer('earnedPoints');
            $table->float('percentage', 5);
            $table->timestamps();
            $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('practice_exam_results');
    }
};
