<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurriculumSeeder extends Seeder
{
    public function run()
    {
        DB::table('curriculum')->updateOrInsert(['curriculumType' => 'Old'], ['curriculumType' => 'Old']);
        DB::table('curriculum')->updateOrInsert(['curriculumType' => 'New'], ['curriculumType' => 'New']);
    }
} 