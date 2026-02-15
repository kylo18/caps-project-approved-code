<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('semester', function (Blueprint $table) {
            $table->id('semesterID');
            $table->string('semesterDescription', 50);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('semester');
    }
};