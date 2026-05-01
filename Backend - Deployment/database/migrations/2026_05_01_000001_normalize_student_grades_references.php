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
        Schema::table('student_grades', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->unsignedBigInteger('student_id')->nullable()->after('user_id');
            $table->unsignedBigInteger('subject_id')->nullable()->after('student_id');
            $table->unsignedBigInteger('curriculum_id')->nullable()->after('subject_id');
        });

        // Backfill user_id from users.userCode matching
        DB::update(
            "UPDATE student_grades sg
             INNER JOIN users u ON sg.userCode = u.userCode
             SET sg.user_id = u.userID
             WHERE sg.user_id IS NULL AND sg.userCode IS NOT NULL"
        );

        // Backfill subject_id from subjects.subjectCode matching
        DB::update(
            "UPDATE student_grades sg
             INNER JOIN subjects s ON sg.subjectCode = s.subjectCode
             SET sg.subject_id = s.subjectID
             WHERE sg.subject_id IS NULL AND sg.subjectCode IS NOT NULL"
        );

        // Backfill student_id from students.userCode matching
        DB::update(
            "UPDATE student_grades sg
             INNER JOIN students st ON sg.userCode = st.userCode
             SET sg.student_id = st.id
             WHERE sg.student_id IS NULL AND sg.userCode IS NOT NULL"
        );

        Log::info("M1: Backfilled user_id, subject_id, student_id for student_grades");

        // Add foreign keys
        Schema::table('student_grades', function (Blueprint $table) {
            $table->foreign('user_id')->references('userID')->on('users')->onDelete('set null');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('set null');
            $table->foreign('subject_id')->references('subjectID')->on('subjects')->onDelete('set null');
            $table->foreign('curriculum_id')->references('id')->on('curriculum')->onDelete('set null');
        });

        // Add composite index
        Schema::table('student_grades', function (Blueprint $table) {
            $table->index(['user_id', 'subject_id'], 'idx_student_grades_user_subject');
            $table->index('student_id');
            $table->index('curriculum_id');
        });
    }

    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['student_id']);
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['curriculum_id']);
            $table->dropIndex('idx_student_grades_user_subject');
            $table->dropIndex(['student_id']);
            $table->dropIndex(['curriculum_id']);
            $table->dropColumn(['user_id', 'student_id', 'subject_id', 'curriculum_id']);
        });
    }
};