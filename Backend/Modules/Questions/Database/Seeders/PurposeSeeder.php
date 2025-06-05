<?php

namespace Modules\Questions\Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PurposeSeeder extends Seeder
{
    public function run()
    {
        try {
            DB::table('purposes')->insert([
                ['name' => 'examQuestions'],
                ['name' => 'practiceQuestions'],
                ['name' => 'personalQuestions'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed purpose table: ' . $e->getMessage());
        }
    }
}
