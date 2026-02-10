<?php

namespace Modules\Subjects\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class YearLevelsTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('year_levels')->insert([
            [
                'name' => '1st Year',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '2nd Year',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '3rd Year',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => '4th Year',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
} 