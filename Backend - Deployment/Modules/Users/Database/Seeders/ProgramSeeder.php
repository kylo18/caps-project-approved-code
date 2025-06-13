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
                ['programID' => 1, 'programName' => 'BSCOE'],
                ['programID' => 2, 'programName' => 'BSEE'],
                ['programID' => 3, 'programName' => 'BSCE'],
                ['programID' => 4, 'programName' => 'BSECE'],
                ['programID' => 5, 'programName' => 'BSABE'],
            ]);
        } catch (Exception $e) {
            Log::error('Failed to seed programs table: ' . $e->getMessage());
        }
    }
}
