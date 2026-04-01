<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('question_stats_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions', 'questionID')->onDelete('cascade');
            $table->foreignId('topic_id')->constrained('coverages')->onDelete('cascade');
            $table->date('stat_date');
            $table->integer('total_attempts')->default(0);
            $table->integer('total_correct')->default(0);
            $table->integer('total_incorrect')->default(0);
            $table->integer('total_skipped')->default(0);
            $table->decimal('error_rate', 5, 4)->default(0);
            // error_rate = total_incorrect / total_attempts
            $table->timestamps();

            $table->unique(['question_id', 'stat_date']);
            $table->index(['topic_id', 'stat_date']);
            $table->index('error_rate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_stats_daily');
    }
};