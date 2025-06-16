<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class StudentsTableSeeder extends Seeder
{
    public function run()
    {
        try {
            // Temporarily disable foreign key checks
            Schema::disableForeignKeyConstraints();

            // Get all CSV files from the path
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

                    // Get program ID - check both programName and programName2
                    $program = DB::table('programs')
                        ->where('programName', $data['Program'])
                        ->orWhere('programName2', $data['Program'])
                        ->first();

                    if (!$program) {
                        Log::error("Program not found: {$data['Program']}");
                        $skippedRecords++;
                        continue;
                    }

                    // Normalize and get sex ID
                    $sex = strtoupper(trim($data['Sex']));
                    if (!in_array($sex, ['MALE', 'FEMALE'])) {
                        $sex = 'MALE'; // Default to MALE if invalid
                    }
                    
                    $sexRecord = DB::table('sexes')
                        ->where('name', $sex)
                        ->first();

                    if (!$sexRecord) {
                        Log::error("Sex not found in database: $sex");
                        $skippedRecords++;
                        continue;
                    }

                    // Prepare student data
                    $studentData = [
                        'userCode' => trim($data['ID Number']),
                        'fullName' => trim($data['Full Name']),
                        'lastName' => trim($lastName),
                        'firstName_middleName' => trim($firstName_middleName),
                        'sex_id' => $sexRecord->id,
                        'programID' => $program->programID,
                        'yearLevel' => (int)$data['Year Level'],
                        'block' => trim($data['Block']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    try {
                        // Update or create student record
                        DB::table('students')->updateOrInsert(
                            ['userCode' => $studentData['userCode']], // The unique key to check
                            $studentData // The data to update or insert
                        );
                        $insertedRecords++;
                        Log::info("Successfully processed student with ID: {$studentData['userCode']}");
                    } catch (\Exception $e) {
                        Log::error("Database error for student {$studentData['userCode']}: " . $e->getMessage());
                        $skippedRecords++;
                    }
                }

                fclose($handle);
            }

            // Re-enable foreign key checks
            Schema::enableForeignKeyConstraints();

            $this->command->info("Import Summary:");
            $this->command->info("Total records processed: " . $totalRecords);
            $this->command->info("Records skipped: " . $skippedRecords);
            $this->command->info("Records inserted: " . $insertedRecords);
            $this->command->info('Successfully imported student data from CSV files!');
        } catch (\Exception $e) {
            // Make sure to re-enable foreign key checks even if an error occurs
            Schema::enableForeignKeyConstraints();
            
            $this->command->error('Failed to import student data: ' . $e->getMessage());
            Log::error('Student import error: ' . $e->getMessage());
            throw $e;
        }
    }
} 