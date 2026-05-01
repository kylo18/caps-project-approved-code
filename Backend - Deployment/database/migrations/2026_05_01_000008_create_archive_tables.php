<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempts_archive', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('exam_id');
            $table->unsignedInteger('attempt_number')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->string('status', 20)->default('completed');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->index('archived_at');
        });

        Schema::create('question_stats_daily_archive', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->unsignedBigInteger('topic_id');
            $table->date('stat_date');
            $table->integer('total_attempts')->default(0);
            $table->integer('total_correct')->default(0);
            $table->integer('total_incorrect')->default(0);
            $table->integer('total_skipped')->default(0);
            $table->decimal('error_rate', 5, 4)->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->index('archived_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts_archive');
        Schema::dropIfExists('question_stats_daily_archive');
    }
};