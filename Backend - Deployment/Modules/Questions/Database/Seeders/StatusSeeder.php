<?php

namespace Modules\Questions\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class StatusSeeder extends Seeder
{
    public function run()
    {
        try {
            $statuses = [
                ['name' => 'pending'],
                ['name' => 'approved'],
                ['name' => 'disapproved'],
                ['name' => 'registered'],
            ];

            foreach ($statuses as $status) {
                DB::table('statuses')->updateOrInsert(
                    ['name' => $status['name']],
                    $status
                );
            }
        } catch (Exception $e) {
            Log::error('Failed to seed status table: ' . $e->getMessage());
        }
    }
}
