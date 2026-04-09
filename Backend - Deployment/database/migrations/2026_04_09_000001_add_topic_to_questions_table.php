<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a `topic` column to the `questions` table so that analytics
     * queries that select `questions.topic` no longer crash.
     *
     * The column is populated from coverages.name via the existing
     * questions.coverage_id FK to keep data consistent.
     */
    public function up(): void
    {
        // 1. Add the column
        Schema::table('questions', function (Blueprint $table) {
            $table->string('topic', 191)->nullable()->after('coverage_id');
        });

        // 2. Back-fill every question's topic from coverages.name
        //    This handles existing rows so analytics don't see NULL.
        DB::statement(
            'UPDATE questions q
             INNER JOIN coverages c ON q.coverage_id = c.id
             SET q.topic = c.name'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('topic');
        });
    }
};
