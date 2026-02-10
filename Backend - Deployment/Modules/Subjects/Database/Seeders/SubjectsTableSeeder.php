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
        $thirdYearId = DB::table('year_levels')->where('name', '3rd Year')->first()->yearLevelID;
        $fourthYearId = DB::table('year_levels')->where('name', '4th Year')->first()->yearLevelID;

        $subjects = [
            // Computer Science (4 subjects)
            ['code' => 'CS101', 'name' => 'Introduction to Computer Science', 'year' => $firstYearId, 'program' => 1],
            ['code' => 'CS201', 'name' => 'Data Structures and Algorithms', 'year' => $secondYearId, 'program' => 1],
            ['code' => 'CS301', 'name' => 'Database Management Systems', 'year' => $thirdYearId, 'program' => 1],
            ['code' => 'CS401', 'name' => 'Artificial Intelligence', 'year' => $fourthYearId, 'program' => 1],

            // Agricultural Engineering (4 subjects)
            ['code' => 'ABE101', 'name' => 'Introduction to Agricultural Engineering', 'year' => $firstYearId, 'program' => 2],
            ['code' => 'ABE201', 'name' => 'Soil Mechanics and Conservation', 'year' => $secondYearId, 'program' => 2],
            ['code' => 'ABE301', 'name' => 'Irrigation Systems Design', 'year' => $thirdYearId, 'program' => 2],
            ['code' => 'ABE401', 'name' => 'Smart Farming Technologies', 'year' => $fourthYearId, 'program' => 2],

            // Civil Engineering (4 subjects)
            ['code' => 'CE101', 'name' => 'Engineering Drawing and Design', 'year' => $firstYearId, 'program' => 3],
            ['code' => 'CE201', 'name' => 'Structural Analysis', 'year' => $secondYearId, 'program' => 3],
            ['code' => 'CE301', 'name' => 'Reinforced Concrete Design', 'year' => $thirdYearId, 'program' => 3],
            ['code' => 'CE401', 'name' => 'Steel Design', 'year' => $fourthYearId, 'program' => 3],

            // Electronics Engineering (4 subjects)
            ['code' => 'ECE101', 'name' => 'Basic Electronics', 'year' => $firstYearId, 'program' => 4],
            ['code' => 'ECE201', 'name' => 'Electronic Circuits', 'year' => $secondYearId, 'program' => 4],
            ['code' => 'ECE301', 'name' => 'Microprocessors and Microcontrollers', 'year' => $thirdYearId, 'program' => 4],
            ['code' => 'ECE401', 'name' => 'Wireless Communications', 'year' => $fourthYearId, 'program' => 4],

            // Electrical Engineering (4 subjects)
            ['code' => 'EE101', 'name' => 'Electrical Circuits', 'year' => $firstYearId, 'program' => 5],
            ['code' => 'EE201', 'name' => 'Electromagnetic Theory', 'year' => $secondYearId, 'program' => 5],
            ['code' => 'EE301', 'name' => 'Power Systems Analysis', 'year' => $thirdYearId, 'program' => 5],
            ['code' => 'EE401', 'name' => 'High Voltage Engineering', 'year' => $fourthYearId, 'program' => 5],
        ];

        // Insert all subjects
        foreach ($subjects as $subject) {
            DB::table('subjects')->insert([
                'subjectCode' => $subject['code'],
                'subjectName' => $subject['name'],
                'programID' => $subject['program'],
                'yearLevelID' => $subject['year'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
