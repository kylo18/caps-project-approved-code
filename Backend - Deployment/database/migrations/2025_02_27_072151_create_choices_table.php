<?php
//normalization
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users', 'userID')->onDelete('cascade');
            $table->foreignId('exam_id')->constrained('exams', 'examID')->onDelete('cascade');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->string('status')->default('in_progress');
            // status: in_progress | completed | abandoned
            $table->timestamps();

            $table->index(['user_id', 'exam_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};