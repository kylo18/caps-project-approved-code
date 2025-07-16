<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('practice_exam_drafts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userID');
            $table->unsignedBigInteger('subjectID');
            $table->json('questions');
            $table->json('answers')->nullable();
            $table->integer('time_left'); // seconds
            $table->timestamp('started_at');
            $table->timestamps();

            $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
            $table->unique(['userID', 'subjectID']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('practice_exam_drafts');
    }
}; 