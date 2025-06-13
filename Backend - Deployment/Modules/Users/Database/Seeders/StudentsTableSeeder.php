<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class StudentsTableSeeder extends Seeder
{
    public function run()
    {
        try {
            // Get all CSV files from the new path
            $files = glob(base_path('public/csv/*.csv'));
            
            if (empty($files)) {
                $this->command->error('No CSV files found in public/csv directory!');
                return;
            }

            $totalRecords = 0;
            $skippedRecords = 0;
            $insertedRecords = 0;

            foreach ($files as $file) {
                $this->command->info("Processing file: " . basename($file));
                
                // Read CSV file
                $handle = fopen($file, 'r');
                
                // Skip the title row
                fgetcsv($handle);
                
                // Get headers from the second row
                $headers = fgetcsv($handle);
                if (!$headers) {
                    Log::error("Could not read headers from file: $file");
                    continue;
                }

                // Process each row
                while (($row = fgetcsv($handle)) !== false) {
                    $totalRecords++;
                    $data = array_combine($headers, $row);
                    
                    // Set default values for missing fields
                    $data['ID Number'] = $data['ID Number'] ?? 'UNKNOWN-' . uniqid();
                    $data['Full Name'] = $data['Full Name'] ?? 'Unknown Name';
                    $data['Sex'] = $data['Sex'] ?? 'MALE';
                    $data['Program'] = $data['Program'] ?? 'BSABE';
                    $data['Year Level'] = $data['Year Level'] ?? '1';
                    $data['Block'] = $data['Block'] ?? 'A';

                    // Split the full name into last name and first name + middle name
                    $nameParts = explode(',', $data['Full Name']);
                    if (count($nameParts) !== 2) {
                        // If name format is invalid, use the full name as last name
                        $lastName = trim($data['Full Name']);
                        $firstName_middleName = '';
                    } else {
                        $lastName = trim($nameParts[0]);
                        $firstName_middleName = trim($nameParts[1]);
                    }

                    // Get program ID
                    $program = DB::table('programs')
                        ->where('programName', $data['Program'])
                        ->first();

                    if (!$program) {
                        // If program not found, use the first available program
                        $program = DB::table('programs')->first();
                        if (!$program) {
                            Log::error("No programs found in database");
                            continue;
                        }
                    }

                    // Convert sex value to match enum
                    $sex = strtoupper(trim($data['Sex']));
                    if (!in_array($sex, ['MALE', 'FEMALE'])) {
                        $sex = 'MALE'; // Default to MALE if invalid
                    }

                    // Prepare student data
                    $studentData = [
                        'userCode' => $data['ID Number'],
                        'fullName' => $data['Full Name'],
                        'lastName' => $lastName,
                        'firstName_middleName' => $firstName_middleName,
                        'sex' => $sex,
                        'programID' => $program->programID,
                        'yearLevel' => (int)$data['Year Level'],
                        'block' => $data['Block'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Log the data being inserted
                    Log::info("Attempting to insert/update student: " . json_encode($studentData));

                    try {
                        // For students table, update the oldest record if duplicate exists
                        $existingStudent = DB::table('students')
                            ->where('userCode', $data['ID Number'])
                            ->orderBy('created_at', 'asc')
                            ->first();

                        if ($existingStudent) {
                            DB::table('students')
                                ->where('id', $existingStudent->id)
                                ->update($studentData);
                        } else {
                            DB::table('students')->insert($studentData);
                        }

                        $insertedRecords++;
                        Log::info("Successfully inserted/updated student with ID: {$data['ID Number']}");
                    } catch (\Exception $e) {
                        Log::error("Database error for student {$data['ID Number']}: " . $e->getMessage());
                        $skippedRecords++;
                    }
                }

                fclose($handle);
            }

            $this->command->info("Import Summary:");
            $this->command->info("Total records processed: " . $totalRecords);
            $this->command->info("Records skipped: " . $skippedRecords);
            $this->command->info("Records inserted/updated: " . $insertedRecords);
            $this->command->info('Successfully imported student data from CSV files!');
        } catch (\Exception $e) {
            $this->command->error('Failed to import student data: ' . $e->getMessage());
            Log::error('Student import error: ' . $e->getMessage());
            throw $e;
        }
    }
} 