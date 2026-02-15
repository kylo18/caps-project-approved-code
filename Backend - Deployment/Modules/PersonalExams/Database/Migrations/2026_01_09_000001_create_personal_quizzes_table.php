<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('personal_quizzes', function (Blueprint $table) {
            $table->id('personalQuizID');
            $table->string('title');
            $table->text('description')->nullable(); // Optional overview for custom/subject-specific quizzes
            $table->text('instruction')->nullable(); // Shown to students before taking the quiz
            $table->foreignId('quiz_type_id')->constrained('quiz_types');
            $table->foreignId('subjectID')->nullable()->constrained('subjects', 'subjectID');
            $table->foreignId('coverage_id')->nullable()->constrained('coverages');
            $table->foreignId('created_by')->constrained('users', 'userID');
            $table->boolean('isArchived')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('personal_quizzes');
    }
};

