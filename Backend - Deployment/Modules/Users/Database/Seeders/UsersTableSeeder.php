<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UsersTableSeeder extends Seeder
{
    public function run()
    {
        try {
            // Get status ID for registered users
            $registeredStatusId = DB::table('statuses')
                ->where('name', 'registered')
                ->first()
                ->id;

            $users = [
                // Original users
                [
                    'userCode' => '23-A-02087',
                    'firstName' => 'Kent',
                    'lastName' => 'Apat',
                    'email' => 'kentapat123@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 4,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4
                ],
                // Dean
                [
                    'userCode' => '23-A-12345',
                    'firstName' => 'Gillert',
                    'lastName' => 'Bongcac',
                    'email' => 'bongcac@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 4,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => 4,
                    'programID' => 4
                ],
                // Program Chairs
                [
                    'userCode' => '23-A-12346',
                    'firstName' => 'Troy',
                    'lastName' => 'Lasco',
                    'email' => 'Troy@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-11111',
                    'firstName' => 'Agri',
                    'lastName' => 'Bio',
                    'email' => 'abe@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 2
                ],
                [
                    'userCode' => '23-A-22222',
                    'firstName' => 'CE',
                    'lastName' => 'Engr',
                    'email' => 'ce@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 3
                ],
                [
                    'userCode' => '23-A-33333',
                    'firstName' => 'ECE',
                    'lastName' => 'Eng',
                    'email' => 'ece@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4
                ],
                [
                    'userCode' => '23-A-55555',
                    'firstName' => 'EE',
                    'lastName' => 'Egr',
                    'email' => 'ee@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 5
                ],

                // Faculty
                [
                    'userCode' => '23-A-12347',
                    'firstName' => 'Ryann',
                    'lastName' => 'Elumba',
                    'email' => 'Ryann@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-11112',
                    'firstName' => 'Abe2',
                    'lastName' => 'Bio',
                    'email' => 'abe2@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 2
                ],
                [
                    'userCode' => '23-A-22223',
                    'firstName' => 'CE2',
                    'lastName' => 'Engr',
                    'email' => 'ce2@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 3
                ],
                [
                    'userCode' => '23-A-33334',
                    'firstName' => 'ECE2',
                    'lastName' => 'Eng',
                    'email' => 'ece2@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4
                ],
                [
                    'userCode' => '23-A-55556',
                    'firstName' => 'EE2',
                    'lastName' => 'Egr',
                    'email' => 'ee2@gmail.com',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 5
                ],
            ];

            // Add 5000 more users
            $roles = [2, 3, 4]; // Faculty, Program Chair, Dean
            $campuses = [1, 2];
            $programs = [1, 2, 3, 4, 5];
            $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
            $firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'];

            // Start a database transaction
            DB::beginTransaction();

            try {
                // Insert original users first
                DB::table('users')->insert($users);

                // Generate and insert bulk users in smaller chunks
                $chunkSize = 100; // Smaller chunk size for better memory management
                $totalUsers = 5000;
                $bulkUsers = [];
                $usedUserCodes = [];
                $usedEmails = [];

                // Get existing user codes and emails
                $existingUsers = DB::table('users')->select('userCode', 'email')->get();
                foreach ($existingUsers as $user) {
                    $usedUserCodes[] = $user->userCode;
                    $usedEmails[] = $user->email;
                }

                for ($i = 1; $i <= $totalUsers; $i++) {
                    // Generate unique user code
                    do {
                        $year = 23;
                        $campus = 'A';
                        $number = str_pad($i + 10000, 5, '0', STR_PAD_LEFT);
                        $userCode = "{$year}-{$campus}-{$number}";
                    } while (in_array($userCode, $usedUserCodes));
                    
                    $firstName = $firstNames[array_rand($firstNames)];
                    $lastName = $lastNames[array_rand($lastNames)];
                    
                    // Generate unique email
                    $baseEmail = strtolower($firstName . '.' . $lastName);
                    $email = $baseEmail . $i . '@university.edu';
                    $counter = 1;
                    while (in_array($email, $usedEmails)) {
                        $email = $baseEmail . $i . '_' . $counter . '@university.edu';
                        $counter++;
                    }

                    // Add to used arrays
                    $usedUserCodes[] = $userCode;
                    $usedEmails[] = $email;
                    
                    $bulkUsers[] = [
                        'userCode' => $userCode,
                        'firstName' => $firstName,
                        'lastName' => $lastName,
                        'email' => $email,
                        'password' => Hash::make('12345678'),
                        'roleID' => $roles[array_rand($roles)],
                        'campusID' => $campuses[array_rand($campuses)],
                        'isActive' => true,
                        'status_id' => $registeredStatusId,
                        'programID' => $programs[array_rand($programs)]
                    ];

                    // Insert in chunks
                    if (count($bulkUsers) >= $chunkSize) {
                        DB::table('users')->insert($bulkUsers);
                        $bulkUsers = []; // Clear the array
                    }
                }

                // Insert any remaining users
                if (!empty($bulkUsers)) {
                    DB::table('users')->insert($bulkUsers);
                }

                // Commit the transaction
                DB::commit();
                
                $this->command->info("Successfully seeded 5000 users!");
                
            } catch (\Exception $e) {
                // Rollback the transaction on error
                DB::rollBack();
                Log::error('Error in UsersTableSeeder: ' . $e->getMessage());
                throw $e;
            }
        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
            throw $e;
        }
    }
}
