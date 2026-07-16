<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // subjects table
        Schema::table('subjects', function (Blueprint $table) {
            $table->index('programID', 'idx_subjects_program');
        });

        // practice_exam_results table
        Schema::table('practice_exam_results', function (Blueprint $table) {
            $table->index('userID', 'idx_per_user');
            $table->index('subjectID', 'idx_per_subject');
            $table->index(['userID', 'subjectID'], 'idx_per_user_subject');
            $table->index('created_at', 'idx_per_created');
            $table->index(['created_at', 'userID'], 'idx_per_created_user');
        });

        // faculty_subjects table
        Schema::table('faculty_subjects', function (Blueprint $table) {
            $table->index('facultyID', 'idx_fs_faculty');
            $table->unique(['facultyID', 'subjectID'], 'uniq_fs_faculty_subject');
        });

        // questions table
        Schema::table('questions', function (Blueprint $table) {
            $table->index('subjectID', 'idx_q_subject');
            $table->index(['subjectID', 'status_id'], 'idx_q_subject_status');
            $table->index(['subjectID', 'userID'], 'idx_q_subject_user');
            $table->index('purpose_id', 'idx_q_purpose');
            $table->index('status_id', 'idx_q_status');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropIndex('idx_subjects_program');
        });

        Schema::table('practice_exam_results', function (Blueprint $table) {
            $table->dropIndex('idx_per_user');
            $table->dropIndex('idx_per_subject');
            $table->dropIndex('idx_per_user_subject');
            $table->dropIndex('idx_per_created');
            $table->dropIndex('idx_per_created_user');
        });

        Schema::table('faculty_subjects', function (Blueprint $table) {
            $table->dropIndex('idx_fs_faculty');
            $table->dropUnique('uniq_fs_faculty_subject');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex('idx_q_subject');
            $table->dropIndex('idx_q_subject_status');
            $table->dropIndex('idx_q_subject_user');
            $table->dropIndex('idx_q_purpose');
            $table->dropIndex('idx_q_status');
        });
    }
};