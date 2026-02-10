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
        Schema::create('practice_exam_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subjectID');
            $table->boolean('enableTimer')->default(false);
            $table->integer('duration_minutes')->default(20);
            $table->string('coverage')->default('full');
            $table->integer('easy_percentage')->default(30);
            $table->integer('moderate_percentage')->default(50);
            $table->integer('hard_percentage')->default(20);
            $table->integer('total_items')->default(100);
            $table->unsignedBigInteger('createdBy');
            $table->timestamps();

            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');
            $table->foreign('createdBy')->references('userID')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_exam_settings');
    }
};
