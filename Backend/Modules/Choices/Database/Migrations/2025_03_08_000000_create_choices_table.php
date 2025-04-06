<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('choices', function (Blueprint $table) {
            $table->bigIncrements('choiceID');
            $table->unsignedBigInteger('questionID');
            $table->text('choiceText')->nullable();
            $table->string('image')->nullable();
            $table->boolean('isCorrect')->default(false);
            $table->timestamps();

            $table->foreign('questionID')
                ->references('questionID')
                ->on('questions')
                ->onDelete('cascade');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('choices');
    }
};
