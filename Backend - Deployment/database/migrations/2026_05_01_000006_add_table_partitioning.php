<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('exam_results_partitioned')) {
            Schema::create('exam_results_partitioned', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('attempt_id');
                $table->unsignedBigInteger('question_id');
                $table->unsignedBigInteger('topic_id');
                $table->unsignedBigInteger('subject_id');
                $table->unsignedBigInteger('difficulty_id')->nullable();
                $table->boolean('is_correct')->default(false);
                $table->boolean('is_skipped')->default(false);
                $table->integer('time_spent')->default(0);
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index(['subject_id', 'is_correct'], 'idx_subject_correct_part');
                $table->index(['attempt_id', 'is_correct'], 'idx_attempt_correct_part');
                $table->index(['subject_id', 'time_spent'], 'idx_subject_time_part');
            });
        }

        if (!Schema::hasTable('exam_attempts_partitioned')) {
            Schema::create('exam_attempts_partitioned', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('exam_id');
                $table->unsignedInteger('attempt_number')->default(1);
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->string('status', 20)->default('in_progress');
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index(['user_id', 'exam_id'], 'idx_user_exam_part');
                $table->index('status');
            });
        }

        Log::info('M6: Partition support tables created');
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results_partitioned');
        Schema::dropIfExists('exam_attempts_partitioned');
    }
};