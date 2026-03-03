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
            $status = DB::table('statuses')
                ->where('name', 'registered')
                ->first();

            if (!$status) {
                throw new \Exception('Status "registered" not found in statuses table');
            }

            $registeredStatusId = $status->id;

            /**
             * ============================
             * DEFAULT USERS (UPDATED)
             * ============================
             */
            $users = [

                // Dean Account
                [
                    'userCode' => '23-A-12345',
                    'firstName' => 'Dean',
                    'lastName' => 'Account',
                    'email' => 'dean.account@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 4,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],

                // Associate Dean Account
                [
                    'userCode' => '23-A-02087',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => 'associate.dean@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 5,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],

                // Program Chair Accounts
                [
                    'userCode' => '23-A-00000',
                    'firstName' => 'CE',
                    'lastName' => 'Chair',
                    'email' => 'ce.chair@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 3,
                ],
                [
                    'userCode' => '23-A-00001',
                    'firstName' => 'CPE',
                    'lastName' => 'Chair',
                    'email' => 'cpe.chair@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '23-A-00010',
                    'firstName' => 'EE',
                    'lastName' => 'Chair',
                    'email' => 'ee.chair@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 2,
                ],
                [
                    'userCode' => '23-A-00011',
                    'firstName' => 'ECE',
                    'lastName' => 'Chair',
                    'email' => 'ece.chair@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],

                // Faculty Accounts
                [
                    'userCode' => '23-A-00100',
                    'firstName' => 'CE',
                    'lastName' => 'Faculty',
                    'email' => 'ce.faculty@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 3,
                ],
                [
                    'userCode' => '23-A-00101',
                    'firstName' => 'CPE',
                    'lastName' => 'Faculty',
                    'email' => 'cpe.faculty@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '23-A-00110',
                    'firstName' => 'EE',
                    'lastName' => 'Faculty',
                    'email' => 'ee.faculty@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 2,
                ],
                [
                    'userCode' => '23-A-00111',
                    'firstName' => 'ECE',
                    'lastName' => 'Faculty',
                    'email' => 'ece.faculty@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],

                // Student Accounts
                [
                    'userCode' => '23-A-01000',
                    'firstName' => 'CE',
                    'lastName' => 'Student',
                    'email' => 'ce.student@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 3,
                ],
                [
                    'userCode' => '23-A-01001',
                    'firstName' => 'CPE',
                    'lastName' => 'Student',
                    'email' => 'cpe.student@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '23-A-01010',
                    'firstName' => 'EE',
                    'lastName' => 'Student',
                    'email' => 'ee.student@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 2,
                ],
                [
                    'userCode' => '23-A-01011',
                    'firstName' => 'ECE',
                    'lastName' => 'Student',
                    'email' => 'ece.student@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],

                // Katipunan Campus
                /*
                [
                    'userCode' => '22-A-12345',
                    'firstName' => 'Dean',
                    'lastName' => 'Account',
                    'email' => 'katipunan.dean@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 4,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],*/
                [
                    'userCode' => '22-A-02087',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => 'katipunan.associate@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 5,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],
                [
                    'userCode' => '22-A-00000',
                    'firstName' => 'ABE',
                    'lastName' => 'Chair',
                    'email' => 'katipunan.abe.chair@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-00100',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'katipunan.abe.faculty1@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-00101',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'katipunan.abe.faculty2@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-00110',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'katipunan.abe.faculty3@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-00111',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'katipunan.abe.faculty4@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-01000',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'katipunan.abe.student1@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-01001',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'katipunan.abe.student2@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-01010',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'katipunan.abe.student3@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '22-A-01011',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'katipunan.abe.student4@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 2,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],

                // Tampilisan Campus
                /*
                [
                    'userCode' => '21-A-12345',
                    'firstName' => 'Dean',
                    'lastName' => 'Account',
                    'email' => 'tampilisan.dean@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 4,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ], */
                
                [
                    'userCode' => '21-A-02087',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => 'tampilisan.associate@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 5,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 4,
                ],
                [
                    'userCode' => '21-A-00000',
                    'firstName' => 'ABE',
                    'lastName' => 'Chair',
                    'email' => 'tampilisan.abe.chair@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 3,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-00100',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'tampilisan.abe.faculty1@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-00101',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'tampilisan.abe.faculty2@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-00110',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'tampilisan.abe.faculty3@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-00111',
                    'firstName' => 'ABE',
                    'lastName' => 'Faculty',
                    'email' => 'tampilisan.abe.faculty4@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 2,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-01000',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'tampilisan.abe.student1@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-01001',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'tampilisan.abe.student2@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-01010',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'tampilisan.abe.student3@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
                [
                    'userCode' => '21-A-01011',
                    'firstName' => 'ABE',
                    'lastName' => 'Student',
                    'email' => 'tampilisan.abe.student4@university.edu',
                    'password' => Hash::make('12345678'),
                    'roleID' => 1,
                    'campusID' => 3,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1,
                ],
            ];

            DB::table('users')->insert($users);

            /**
             * ============================
             * ADDITIONAL USERS (50 ONLY)
             * ============================
             * (COMMENTED OUT)
             */
            // $roles = [2, 3, 4];
            // $campuses = [1, 2];
            // $programs = [1, 2, 3, 4, 5];
            // $firstNames = ['James', 'John', 'Robert', 'Michael', 'William'];
            // $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];

            // $chunkSize = 25;
            // $totalUsers = 50;
            // $bulkUsers = [];

            // for ($i = 1; $i <= $totalUsers; $i++) {
            //     $userCode = "23-A-" . str_pad($i + 20000, 5, '0', STR_PAD_LEFT);

            //     $firstName = $firstNames[array_rand($firstNames)];
            //     $lastName = $lastNames[array_rand($lastNames)];

            //     $bulkUsers[] = [
            //         'userCode' => $userCode,
            //         'firstName' => $firstName,
            //         'lastName' => $lastName,
            //         'email' => strtolower("{$firstName}.{$lastName}{$i}@university.edu"),
            //         'password' => Hash::make('12345678'),
            //         'roleID' => $roles[array_rand($roles)],
            //         'campusID' => $campuses[array_rand($campuses)],
            //         'isActive' => true,
            //         'status_id' => $registeredStatusId,
            //         'programID' => $programs[array_rand($programs)],
            //     ];

            //     if (count($bulkUsers) >= $chunkSize) {
            //         DB::table('users')->insert($bulkUsers);
            //         $bulkUsers = [];
            //     }
            // }

            // if (!empty($bulkUsers)) {
            //     DB::table('users')->insert($bulkUsers);
            // }

            $this->command->info(
                'Successfully seeded ' . count($users) . ' users!'
            );

        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
            throw $e;
        }
    }
}