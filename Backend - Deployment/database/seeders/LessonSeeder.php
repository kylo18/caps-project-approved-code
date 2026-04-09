<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LessonSeeder extends Seeder
{
    /**
     * Creates one default lesson per subject so that lesson_views
     * has a valid FK target and analytics can display real titles.
     */
    public function run(): void
    {
        if (DB::table('lessons')->count() > 0) {
            $this->command->info('Lessons already seeded. Skipping...');
            return;
        }

        $subjects = DB::table('subjects')->get();

        foreach ($subjects as $index => $subject) {
            DB::table('lessons')->insert([
                'title'         => $subject->subjectName . ' — Overview',
                'subject_id'    => $subject->subjectID,
                'display_order' => $index + 1,
                'is_active'     => true,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        $this->command->info('Lessons seeded: ' . $subjects->count() . ' lessons (one per subject).');
    }
}
