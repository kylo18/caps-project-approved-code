<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id('subjectID');
            $table->string('subjectCode', 20);
            $table->string('subjectName', 100);
            $table->foreignId('programID')->constrained('programs', 'programID')->onDelete('cascade');
            $table->foreignId('yearLevelID')->constrained('year_levels', 'yearLevelID')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subjects');
    }
};
