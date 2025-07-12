<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('personal_exam_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subjectID');
            $table->boolean('isEnabled')->default(true);
            $table->boolean('enableTimer')->default(false);
            $table->integer('duration_minutes')->nullable();
            $table->string('coverage')->nullable();
            $table->integer('easy_percentage')->nullable();
            $table->integer('moderate_percentage')->nullable();
            $table->integer('hard_percentage')->nullable();
            $table->integer('total_items')->nullable();
            $table->unsignedBigInteger('createdBy');
            $table->unsignedTinyInteger('purpose_id')->default(3); // Always 3 for personal
            $table->timestamps();

            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
            $table->foreign('createdBy')->references('userID')->on('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('personal_exam_settings');
    }
}; 