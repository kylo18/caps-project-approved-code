<?php

namespace Modules\PersonalExams\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\PersonalExams\Models\QuizType;

class QuizTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'subjectBased', 'description' => 'Subject-specific personalized quizzes'],
            ['name' => 'custom', 'description' => 'Customized quizzes without a linked subject'],
        ];

        DB::beginTransaction();

        try {
            foreach ($types as $type) {
                QuizType::updateOrCreate(
                    ['name' => $type['name']],
                    ['description' => $type['description']]
                );
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Seeding quiz types failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}

