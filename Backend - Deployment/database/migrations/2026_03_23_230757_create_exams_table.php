<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->integer('total_items')->default(0);
            $table->integer('passing_score')->default(0);
            $table->integer('time_limit')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('subject_id')
                  ->references('id')
                  ->on('subjects')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
