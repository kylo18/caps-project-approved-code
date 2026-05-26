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
            DB::table('coverages')->insertOrIgnore([
                ['id' => 1, 'name' => 'midterm'],
                ['id' => 2, 'name' => 'finals'],
                ['id' => 3, 'name' => 'full'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed coverages table: ' . $e->getMessage());
        }
    }
}

