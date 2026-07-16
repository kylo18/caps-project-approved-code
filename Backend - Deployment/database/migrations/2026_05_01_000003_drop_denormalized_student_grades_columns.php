<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Guard: ensure backfill is complete before dropping columns
        $nullUserId = DB::table('student_grades')->whereNull('user_id')->count();
        $nullSubjectId = DB::table('student_grades')->whereNull('subject_id')->count();

        if ($nullUserId > 0 || $nullSubjectId > 0) {
            throw new \RuntimeException(
                "Cannot drop columns: {$nullUserId} null user_ids, {$nullSubjectId} null subject_ids. Run M1 backfill first."
            );
        }

        // Drop denormalized text columns (keep subjectDesc — descriptive text)
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropColumn([
                'userCode',
                'lastName',
                'firstName',
                'middleName',
                'yearLevel',
                'subjectCode',
            ]);
        });
    }

    public function down(): void
    {
        // Cannot recover dropped columns without backup
        $this->command?->warn("This migration cannot be reversed. Columns are permanently dropped.");
    }
};