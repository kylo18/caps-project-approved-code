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
     * Performance indexes for 1M+ users/questions scale.
     * These indexes optimize common query patterns:
     * - Questions by subject + topic/difficulty/status/coverage
     * - Exam results for analytics (correct rates, time spent)
     * - User lookups by role/campus/program
     * - Practice exam leaderboards
     * - Lesson views continue watching
     */
    public function up(): void
    {
        // ========== QUESTIONS TABLE ==========
        // Primary queries: filtering by subject + various criteria
        Schema::table('questions', function (Blueprint $table) {
            // For: "Get questions by subject and topic"
            if (!DB::select("SHOW INDEX FROM questions WHERE Key_name = 'idx_subject_topic'")) {
                $table->index(['subjectID', 'topic'], 'idx_subject_topic');
            }

            // For: "Get questions by subject and difficulty" (exam generation)
            if (!DB::select("SHOW INDEX FROM questions WHERE Key_name = 'idx_subject_difficulty'")) {
                $table->index(['subjectID', 'difficulty_id'], 'idx_subject_difficulty');
            }

            // For: "Get approved questions by subject"
            if (!DB::select("SHOW INDEX FROM questions WHERE Key_name = 'idx_subject_status'")) {
                $table->index(['subjectID', 'status_id'], 'idx_subject_status');
            }

            // For: "Get questions by coverage/topic"
            if (!DB::select("SHOW INDEX FROM questions WHERE Key_name = 'idx_subject_coverage'")) {
                $table->index(['subjectID', 'coverage_id'], 'idx_subject_coverage');
            }

            // For: "Get faculty's questions by subject"
            if (!DB::select("SHOW INDEX FROM questions WHERE Key_name = 'idx_user_subject'")) {
                $table->index(['userID', 'subjectID'], 'idx_user_subject');
            }
        });

        // ========== EXAM RESULTS TABLE ==========
        // High-growth table: logs every answer
        Schema::table('exam_results', function (Blueprint $table) {
            // For: "Analytics by subject correctness"
            if (!DB::select("SHOW INDEX FROM exam_results WHERE Key_name = 'idx_subject_correct'")) {
                $table->index(['subject_id', 'is_correct'], 'idx_subject_correct');
            }

            // For: "Result analysis by attempt"
            if (!DB::select("SHOW INDEX FROM exam_results WHERE Key_name = 'idx_attempt_correct'")) {
                $table->index(['attempt_id', 'is_correct'], 'idx_attempt_correct');
            }

            // For: "Time spent analysis"
            if (!DB::select("SHOW INDEX FROM exam_results WHERE Key_name = 'idx_subject_time'")) {
                $table->index(['subject_id', 'time_spent'], 'idx_subject_time');
            }
        });

        // ========== USERS TABLE ==========
        // Common queries: role/campus/program filtering
        Schema::table('users', function (Blueprint $table) {
            // For: "Get all faculty/students by role"
            if (!DB::select("SHOW INDEX FROM users WHERE Key_name = 'idx_role_active'")) {
                $table->index(['roleID', 'isActive'], 'idx_role_active');
            }

            // For: "Get users by program and status"
            if (!DB::select("SHOW INDEX FROM users WHERE Key_name = 'idx_program_status'")) {
                $table->index(['programID', 'status_id'], 'idx_program_status');
            }
        });

        // ========== PRACTICE EXAM RESULTS TABLE ==========
        // Leaderboard and student history queries
        Schema::table('practice_exam_results', function (Blueprint $table) {
            // For: "Leaderboard top scores by subject"
            if (!DB::select("SHOW INDEX FROM practice_exam_results WHERE Key_name = 'idx_subject_score'")) {
                $table->index(['subjectID', 'percentage'], 'idx_subject_score');
            }

            // For: "Student exam history by subject and date"
            if (!DB::select("SHOW INDEX FROM practice_exam_results WHERE Key_name = 'idx_user_subject_created'")) {
                $table->index(['userID', 'subjectID', 'created_at'], 'idx_user_subject_created');
            }
        });

        // ========== LESSON VIEWS TABLE ==========
        // Continue watching feature
        Schema::table('lesson_views', function (Blueprint $table) {
            // For: "User's lesson history sorted by date"
            if (!DB::select("SHOW INDEX FROM lesson_views WHERE Key_name = 'idx_user_created'")) {
                $table->index(['user_id', 'created_at'], 'idx_user_created');
            }
        });

        // ========== ANALYTICS TABLES ==========
        // Difficulty and recommendation lookups
        Schema::table('exam_difficulty_analytics', function (Blueprint $table) {
            if (!DB::select("SHOW INDEX FROM exam_difficulty_analytics WHERE Key_name = 'idx_user_difficulty'")) {
                $table->index(['user_id', 'difficulty'], 'idx_user_difficulty');
            }
        });

        Schema::table('exam_recommendations', function (Blueprint $table) {
            if (!DB::select("SHOW INDEX FROM exam_recommendations WHERE Key_name = 'idx_user_type'")) {
                $table->index(['user_id', 'type'], 'idx_user_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes (for rollback/testing)
        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex('idx_subject_topic');
            $table->dropIndex('idx_subject_difficulty');
            $table->dropIndex('idx_subject_status');
            $table->dropIndex('idx_subject_coverage');
            $table->dropIndex('idx_user_subject');
        });

        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropIndex('idx_subject_correct');
            $table->dropIndex('idx_attempt_correct');
            $table->dropIndex('idx_subject_time');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_role_active');
            $table->dropIndex('idx_program_status');
        });

        Schema::table('practice_exam_results', function (Blueprint $table) {
            $table->dropIndex('idx_subject_score');
            $table->dropIndex('idx_user_subject_created');
        });

        Schema::table('lesson_views', function (Blueprint $table) {
            $table->dropIndex('idx_user_created');
        });

        Schema::table('exam_difficulty_analytics', function (Blueprint $table) {
            $table->dropIndex('idx_user_difficulty');
        });

        Schema::table('exam_recommendations', function (Blueprint $table) {
            $table->dropIndex('idx_user_type');
        });
    }
};