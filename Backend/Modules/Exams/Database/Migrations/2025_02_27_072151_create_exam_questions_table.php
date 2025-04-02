<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id('examQuestionID');
            $table->foreignId('examID')->constrained('exams', 'examID')->onDelete('cascade');
            $table->foreignId('questionID')->constrained('questions', 'questionID')->onDelete('cascade');
            $table->boolean('isCorrect')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exam_questions');
    }
};
