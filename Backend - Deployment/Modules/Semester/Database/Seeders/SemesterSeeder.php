<?php

namespace Modules\Semester\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SemesterSeeder extends Seeder
{
    public function run()
    {
        DB::table('semester')->insert([
            ['semesterDescription' => 'First Semester'],
            ['semesterDescription' => 'Second Semester'],
        ]);
    }
}