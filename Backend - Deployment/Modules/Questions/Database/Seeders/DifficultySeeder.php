<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class DifficultySeeder extends Seeder
{
    public function run()
    {
        try {
            DB::table('difficulties')->insert([
                ['name' => 'easy'],
                ['name' => 'moderate'],
                ['name' => 'hard'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed difficulty table: ' . $e->getMessage());
        }
    }
}
