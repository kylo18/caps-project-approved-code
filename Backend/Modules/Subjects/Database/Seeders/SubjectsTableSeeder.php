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
                'CS' => 'Computer Science',
                'MATH' => 'Mathematics',
                'PROG' => 'Programming',
                'DB' => 'Database',
                'NET' => 'Networking'
            ],
            2 => [ // Agricultural and Biosystems Engineering subjects
                'ABE' => 'Agricultural Engineering',
                'SOIL' => 'Soil Science',
                'MECH' => 'Farm Mechanization',
                'IRRI' => 'Irrigation',
                'POST' => 'Post Harvest'
            ],
            3 => [ // Civil Engineering subjects
                'CE' => 'Civil Engineering',
                'STRUCT' => 'Structural',
                'TRANS' => 'Transportation',
                'HYD' => 'Hydraulics',
                'CONST' => 'Construction'
            ],
            4 => [ // Electronics Engineering subjects
                'ECE' => 'Electronics',
                'COMM' => 'Communications',
                'DIGI' => 'Digital Systems',
                'MICRO' => 'Microprocessors',
                'CTRL' => 'Control Systems'
            ],
            5 => [ // Electrical Engineering subjects
                'EE' => 'Electrical',
                'POWER' => 'Power Systems',
                'MACH' => 'Machines',
                'INST' => 'Instrumentation',
                'PROT' => 'Protection'
            ]
        ];

        $yearLevels = [$firstYearId, $secondYearId, $thirdYearId, $fourthYearId];
        $counter = 1;

        foreach ($programSubjects as $programId => $prefixes) {
            foreach ($prefixes as $prefix => $subjectArea) {
                for ($i = 1; $i <= 10; $i++) {
                    $subjects[] = [
                        'programID' => $programId,
                        'subjectCode' => $prefix . str_pad($i, 3, '0', STR_PAD_LEFT),
                        'subjectName' => $subjectArea . ' ' . $i,
                        'yearLevelID' => $yearLevels[($counter - 1) % 4],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $counter++;
                }
            }
        }

        // Insert all subjects
        foreach (array_chunk($subjects, 50) as $chunk) {
            DB::table('subjects')->insert($chunk);
        }
    }
}
