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
                ['programID' => 1, 'programName' => 'BS-CpE', 'programName2' => 'BSCOE'],
                ['programID' => 2, 'programName' => 'BS-EE', 'programName2' => 'BSEE'],
                ['programID' => 3, 'programName' => 'BS-CE', 'programName2' => 'BSCE'],
                ['programID' => 4, 'programName' => 'BS-ECE', 'programName2' => 'BSECE'],
                ['programID' => 5, 'programName' => 'BS-ABE', 'programName2' => 'BSABE'],
                ['programID' => 6, 'programName' => 'GE', 'programName2' => 'GE'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed programs table: ' . $e->getMessage());
        }
    }
}
