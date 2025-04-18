<?php

namespace Modules\Subjects\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubjectsTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('subjects')->insert([
            [
                'subjectCode' => 'MATH101',
                'subjectName' => 'Basic Algebra',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subjectCode' => 'CS102',
                'subjectName' => 'Introduction to Programming',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subjectCode' => 'ENG103',
                'subjectName' => 'Technical Writing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subjectCode' => 'PHY104',
                'subjectName' => 'Physics for Engineers',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'subjectCode' => 'HIST105',
                'subjectName' => 'World History',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
