<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurriculumSeeder extends Seeder
{
    public function run()
    {
        DB::table('curriculum')->insert([
            ['curriculumType' => 'Old'],
            ['curriculumType' => 'New'],
        ]);
    }
} 