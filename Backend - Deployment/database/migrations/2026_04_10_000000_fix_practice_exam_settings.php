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
     * Fixes practice_exam_settings so all subjects have exam generation enabled:
     * 1. Sets coverage to 'full' for existing settings (so questions from both midterm and finals are included)
     * 2. Creates missing practice_exam_settings for subjects that don't have one
     */
    public function up(): void
    {
        // Fix existing settings: set coverage to 'full' so both midterm and finals questions are included
        DB::table('practice_exam_settings')
            ->update(['coverage' => 'full']);

        // Create settings for subjects that don't have one yet
        $existingSubjectIds = DB::table('practice_exam_settings')->pluck('subjectID')->toArray();
        $allSubjectIds = DB::table('subjects')->pluck('subjectID')->toArray();
        $missingSubjectIds = array_diff($allSubjectIds, $existingSubjectIds);

        foreach ($missingSubjectIds as $subjectId) {
            DB::table('practice_exam_settings')->insert([
                'subjectID'           => $subjectId,
                'coverage'            => 'full',
                'isEnabled'           => true,
                'enableTimer'         => true,
                'duration_minutes'    => 60,
                'easy_percentage'     => 30,
                'moderate_percentage' => 50,
                'hard_percentage'     => 20,
                'total_items'         => 50,
                'createdBy'           => 1,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert coverage back to 'midterm' (original value)
        DB::table('practice_exam_settings')
            ->update(['coverage' => 'midterm']);
    }
};
