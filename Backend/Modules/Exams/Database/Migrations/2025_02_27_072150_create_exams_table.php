<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id('examID');
            $table->foreignId('studentID')->constrained('users', 'userID')->onDelete('cascade');
            $table->foreignId('subjectID')->constrained('subjects', 'subjectID')->onDelete('cascade');
            $table->string('type', 50);
            $table->decimal('score', 5, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exams');
    }
};
