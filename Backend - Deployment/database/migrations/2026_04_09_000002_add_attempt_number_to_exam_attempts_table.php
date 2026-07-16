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
     * Adds attempt_number to exam_attempts so that analytics can track
     * how many times a student has attempted the same exam, and compute
     * "average attempts before passing" accurately.
     */
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->integer('attempt_number')
                  ->default(1)
                  ->after('exam_id');

            // Composite index for per-user per-exam attempt ordering
            $table->index(['user_id', 'exam_id', 'attempt_number'], 'idx_exam_attempts_user_exam_attempt');
        });

        // Back-fill: number each user's existing attempts per exam chronologically
        $rows = DB::table('exam_attempts')
            ->select('id', 'user_id', 'exam_id', 'created_at')
            ->orderBy('user_id')
            ->orderBy('exam_id')
            ->orderBy('created_at')
            ->get()
            ->groupBy(fn ($r) => $r->user_id . ':' . $r->exam_id);

        foreach ($rows as $group) {
            $attemptNo = 1;
            foreach ($group->sortBy('created_at') as $row) {
                DB::table('exam_attempts')
                    ->where('id', $row->id)
                    ->update(['attempt_number' => $attemptNo++]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropIndex('idx_exam_attempts_user_exam_attempt');
            $table->dropColumn('attempt_number');
        });
    }
};
