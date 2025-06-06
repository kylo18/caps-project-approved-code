<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class ProgramSeeder extends Seeder
{
    public function run()
    {
        try {
            DB::table('programs')->insert([
                ['programID' => 1, 'programName' => 'BS-CpE'],
                ['programID' => 2, 'programName' => 'BS-EE'],
                ['programID' => 3, 'programName' => 'BS-CE'],
                ['programID' => 4, 'programName' => 'BS-ECE'],
                ['programID' => 5, 'programName' => 'BS-ABE'],
                ['programID' => 6, 'programName' => 'GE'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed programs table: ' . $e->getMessage());
        }
    }
}
