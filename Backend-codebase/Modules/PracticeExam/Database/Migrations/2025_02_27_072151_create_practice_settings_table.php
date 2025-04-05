<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('practice_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('practice_exam_id')->constrained()->onDelete('cascade');
            $table->boolean('timer_enabled')->default(false);
            $table->unsignedInteger('time_limit')->nullable(); // time limit in minutes if timer_enabled is true
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('practice_settings');
    }
};
