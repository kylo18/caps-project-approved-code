<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class CoverageSeeder extends Seeder
{
    public function run()
    {
        try {
            DB::table('coverages')->insert([
                ['name' => 'midterm'],
                ['name' => 'finals'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed coverages table: ' . $e->getMessage());
        }
    }
}
