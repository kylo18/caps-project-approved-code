<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id('questionID');
            $table->foreignId('subjectID')
                ->constrained('subjects', 'subjectID')
                ->onDelete('cascade');
            $table->foreignId('userID')
                ->constrained('users', 'userID')
                ->onDelete('cascade');
            $table->text('questionText');
            $table->string('image')->nullable();
            $table->integer('score');
            $table->foreignId('purpose_id')->constrained('purposes');
            $table->foreignId('difficulty_id')->constrained('difficulties');
            $table->foreignId('status_id')->constrained('statuses');
            $table->foreignId('coverage_id')->constrained('coverages');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('questions');
    }
};
