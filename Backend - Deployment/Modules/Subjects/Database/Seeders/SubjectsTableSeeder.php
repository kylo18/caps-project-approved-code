<?php

namespace Modules\Subjects\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubjectsTableSeeder extends Seeder
{
    public function run(): void
    {
        // Get year level IDs
        $firstYearId = DB::table('year_levels')->where('name', '1st Year')->first()->yearLevelID;
        $secondYearId = DB::table('year_levels')->where('name', '2nd Year')->first()->yearLevelID;

        DB::table('subjects')->insert([
            [
                'programID' => 1,
                'subjectCode' => 'MATH101',
                'subjectName' => 'Basic Algebra',
                'yearLevelID' => $firstYearId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'programID' => 1,
                'subjectCode' => 'CS102',
                'subjectName' => 'Introduction to Programming',
                'yearLevelID' => $firstYearId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'programID' => 1,
                'subjectCode' => 'ENG103',
                'subjectName' => 'Technical Writing',
                'yearLevelID' => $secondYearId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'programID' => 1,
                'subjectCode' => 'PHY104',
                'subjectName' => 'Physics for Engineers',
                'yearLevelID' => $secondYearId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'programID' => 2,
                'subjectCode' => 'HIST105',
                'subjectName' => 'World History',
                'yearLevelID' => $firstYearId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
