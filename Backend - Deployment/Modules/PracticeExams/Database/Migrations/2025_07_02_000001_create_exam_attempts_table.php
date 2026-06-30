<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Server-authoritative exam attempts.
 *
 * Each row is the single source of truth for one practice-exam sitting:
 * which questions were issued (question_ids), when it started/expires, when it
 * was submitted, and the answers the student ultimately gave. Grading is
 * recomputed from the database against this immutable issued set, so the client
 * can no longer dictate the question list, the score, or the time limit.
 */
return new class extends Migration
{
    public function up()
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            // UUID primary key so attempt identifiers are unguessable (anti-IDOR).
            $table->uuid('id')->primary();

            $table->unsignedBigInteger('userID');
            $table->unsignedBigInteger('subjectID');
            // For personal exams (created by a specific teacher); null for practice.
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->string('type', 20)->default('practice'); // practice | personal

            // Immutable authoritative set of issued question PKs, in delivery order.
            $table->json('question_ids');
            // Persisted student selections [{questionID, selectedChoiceID}] (set at submit).
            $table->json('answers')->nullable();

            // Server-computed denominator captured at generation time.
            $table->integer('total_points')->default(0);

            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->foreign('userID')->references('userID')->on('users')->onDelete('cascade');
            $table->foreign('subjectID')->references('subjectID')->on('subjects')->onDelete('cascade');

            // Fast lookup of a user's in-progress attempt for a subject.
            $table->index(['userID', 'subjectID']);
            $table->index('submitted_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('exam_attempts');
    }
};
