<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProgramSeeder extends Seeder
{
    public function run()
    {
        DB::table('programs')->insert([
            ['programID' => 1, 'programName' => 'BS-CpE'],
            ['programID' => 2, 'programName' => 'BS-EE'],
            ['programID' => 3, 'programName' => 'BS-CE'],
            ['programID' => 4, 'programName' => 'BS-ECE'],
            ['programID' => 5, 'programName' => 'BS-ABE'],
            ['programID' => 6, 'programName' => 'GE'],
        ]);
    }
}
