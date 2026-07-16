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
        // Check if curriculum_id column already exists
        if (Schema::hasColumn('student_grades', 'curriculum_id')) {
            return; // Already migrated by M1
        }

        Schema::table('student_grades', function (Blueprint $table) {
            $table->unsignedBigInteger('curriculum_id')->nullable()->after('subject_id');
            $table->foreign('curriculum_id')->references('id')->on('curriculum')->onDelete('set null');
            $table->index('curriculum_id');
        });

        Log::info('M5: Added curriculum_id column to student_grades');
    }

    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            if (Schema::hasColumn('student_grades', 'curriculum_id')) {
                $table->dropForeign(['curriculum_id']);
                $table->dropColumn('curriculum_id');
            }
        });
    }
};