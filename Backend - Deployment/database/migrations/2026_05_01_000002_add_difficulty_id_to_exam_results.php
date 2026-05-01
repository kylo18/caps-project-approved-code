<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_results', function (Blueprint $table) {
            $table->unsignedBigInteger('difficulty_id')->nullable()->after('subject_id');
        });

        // Map difficulty text values to IDs
        $mapping = [
            'easy' => 1,
            'moderate' => 2,
            'hard' => 3,
        ];

        foreach ($mapping as $name => $id) {
            DB::update(
                "UPDATE exam_results SET difficulty_id = ? WHERE difficulty = ?",
                [$id, $name]
            );
        }

        Schema::table('exam_results', function (Blueprint $table) {
            $table->foreign('difficulty_id')->references('id')->on('difficulties')->onDelete('set null');
            $table->index('difficulty_id');
        });

        // Drop the old text column
        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropColumn('difficulty');
        });

        Log::info('M2: Added difficulty_id FK to exam_results');
    }

    public function down(): void
    {
        Schema::table('exam_results', function (Blueprint $table) {
            $table->string('difficulty', 191)->nullable()->after('subject_id');
        });

        DB::update(
            "UPDATE exam_results er
             LEFT JOIN difficulties d ON er.difficulty_id = d.id
             SET er.difficulty = COALESCE(d.name, 'easy')"
        );

        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropForeign(['difficulty_id']);
            $table->dropColumn('difficulty_id');
        });
    }
};