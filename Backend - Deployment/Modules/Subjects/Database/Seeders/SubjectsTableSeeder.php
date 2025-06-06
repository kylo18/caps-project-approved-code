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

        $subjects = [];
        $programSubjects = [
            1 => [ // Computer Science subjects
                ['code' => 'CS101', 'name' => 'Introduction to Computer Science', 'year' => $firstYearId],
                ['code' => 'CS201', 'name' => 'Data Structures and Algorithms', 'year' => $secondYearId],
                ['code' => 'CS202', 'name' => 'Object-Oriented Programming', 'year' => $secondYearId],
                ['code' => 'CS301', 'name' => 'Database Management Systems', 'year' => $thirdYearId],
                ['code' => 'CS302', 'name' => 'Web Development', 'year' => $thirdYearId],
                ['code' => 'CS303', 'name' => 'Computer Networks', 'year' => $thirdYearId],
                ['code' => 'CS401', 'name' => 'Artificial Intelligence', 'year' => $fourthYearId],
                ['code' => 'CS402', 'name' => 'Software Engineering', 'year' => $fourthYearId],
                ['code' => 'CS403', 'name' => 'Cybersecurity', 'year' => $fourthYearId],
                ['code' => 'CS404', 'name' => 'Machine Learning', 'year' => $fourthYearId],
            ],
            2 => [ // Agricultural and Biosystems Engineering subjects
                ['code' => 'ABE101', 'name' => 'Introduction to Agricultural Engineering', 'year' => $firstYearId],
                ['code' => 'ABE201', 'name' => 'Soil Mechanics and Conservation', 'year' => $secondYearId],
                ['code' => 'ABE202', 'name' => 'Agricultural Power and Machinery', 'year' => $secondYearId],
                ['code' => 'ABE301', 'name' => 'Irrigation Systems Design', 'year' => $thirdYearId],
                ['code' => 'ABE302', 'name' => 'Post-Harvest Technology', 'year' => $thirdYearId],
                ['code' => 'ABE303', 'name' => 'Farm Structures and Environment', 'year' => $thirdYearId],
                ['code' => 'ABE401', 'name' => 'Smart Farming Technologies', 'year' => $fourthYearId],
                ['code' => 'ABE402', 'name' => 'Agricultural Waste Management', 'year' => $fourthYearId],
                ['code' => 'ABE403', 'name' => 'Precision Agriculture', 'year' => $fourthYearId],
                ['code' => 'ABE404', 'name' => 'Renewable Energy in Agriculture', 'year' => $fourthYearId],
            ],
            3 => [ // Civil Engineering subjects
                ['code' => 'CE101', 'name' => 'Engineering Drawing and Design', 'year' => $firstYearId],
                ['code' => 'CE201', 'name' => 'Structural Analysis', 'year' => $secondYearId],
                ['code' => 'CE202', 'name' => 'Construction Materials', 'year' => $secondYearId],
                ['code' => 'CE301', 'name' => 'Reinforced Concrete Design', 'year' => $thirdYearId],
                ['code' => 'CE302', 'name' => 'Soil Mechanics and Foundation', 'year' => $thirdYearId],
                ['code' => 'CE303', 'name' => 'Transportation Engineering', 'year' => $thirdYearId],
                ['code' => 'CE401', 'name' => 'Steel Design', 'year' => $fourthYearId],
                ['code' => 'CE402', 'name' => 'Highway Engineering', 'year' => $fourthYearId],
                ['code' => 'CE403', 'name' => 'Water Resources Engineering', 'year' => $fourthYearId],
                ['code' => 'CE404', 'name' => 'Construction Management', 'year' => $fourthYearId],
            ],
            4 => [ // Electronics Engineering subjects
                ['code' => 'ECE101', 'name' => 'Basic Electronics', 'year' => $firstYearId],
                ['code' => 'ECE201', 'name' => 'Electronic Circuits', 'year' => $secondYearId],
                ['code' => 'ECE202', 'name' => 'Digital Logic Design', 'year' => $secondYearId],
                ['code' => 'ECE301', 'name' => 'Microprocessors and Microcontrollers', 'year' => $thirdYearId],
                ['code' => 'ECE302', 'name' => 'Communications Systems', 'year' => $thirdYearId],
                ['code' => 'ECE303', 'name' => 'Signal Processing', 'year' => $thirdYearId],
                ['code' => 'ECE401', 'name' => 'Wireless Communications', 'year' => $fourthYearId],
                ['code' => 'ECE402', 'name' => 'Embedded Systems', 'year' => $fourthYearId],
                ['code' => 'ECE403', 'name' => 'Control Systems', 'year' => $fourthYearId],
                ['code' => 'ECE404', 'name' => 'Internet of Things', 'year' => $fourthYearId],
            ],
            5 => [ // Electrical Engineering subjects
                ['code' => 'EE101', 'name' => 'Electrical Circuits', 'year' => $firstYearId],
                ['code' => 'EE201', 'name' => 'Electromagnetic Theory', 'year' => $secondYearId],
                ['code' => 'EE202', 'name' => 'Electrical Measurements', 'year' => $secondYearId],
                ['code' => 'EE301', 'name' => 'Power Systems Analysis', 'year' => $thirdYearId],
                ['code' => 'EE302', 'name' => 'Electrical Machines', 'year' => $thirdYearId],
                ['code' => 'EE303', 'name' => 'Power Electronics', 'year' => $thirdYearId],
                ['code' => 'EE401', 'name' => 'High Voltage Engineering', 'year' => $fourthYearId],
                ['code' => 'EE402', 'name' => 'Power Distribution Systems', 'year' => $fourthYearId],
                ['code' => 'EE403', 'name' => 'Electric Drives', 'year' => $fourthYearId],
                ['code' => 'EE404', 'name' => 'Smart Grid Technology', 'year' => $fourthYearId],
            ]
        ];

        foreach ($programSubjects as $programId => $subjectList) {
            foreach ($subjectList as $subject) {
                $subjects[] = [
                    'programID' => $programId,
                    'subjectCode' => $subject['code'],
                    'subjectName' => $subject['name'],
                    'yearLevelID' => $subject['year'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert all subjects
        foreach (array_chunk($subjects, 10) as $chunk) {
            DB::table('subjects')->insert($chunk);
        }
    }
}
