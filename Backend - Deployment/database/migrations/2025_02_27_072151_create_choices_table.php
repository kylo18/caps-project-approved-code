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
        Schema::create('choices', function (Blueprint $table) {
            $table->id('choiceID');
            $table->unsignedBigInteger('questionID');
            $table->text('choiceText')->nullable();
            $table->boolean('isCorrect')->default(false);
            $table->string('image')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
            $table->foreign('questionID')
                  ->references('questionID')
                  ->on('questions')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('choices');
    }
}; 