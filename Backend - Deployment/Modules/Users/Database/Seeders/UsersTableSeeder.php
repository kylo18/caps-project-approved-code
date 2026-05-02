<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run()
    {
        try {
            // Get status ID for registered users, fallback to 4 based on the table screenshot
            $status = DB::table('statuses')->where('name', 'registered')->first();
            $registeredStatusId = $status ? $status->id : 4;

            $users = [
                // // Chairs
                // ['userCode' => '10-A-00000', 'firstName' => 'CE', 'lastName' => 'Chair', 'email' => 'ce.chair@university.edu', 'roleID' => 3, 'campusID' => 1, 'isActive' => 1, 'programID' => 3],
                // ['userCode' => '10-A-00001', 'firstName' => 'CPE', 'lastName' => 'Chair', 'email' => 'cpe.chair@university.edu', 'roleID' => 3, 'campusID' => 1, 'isActive' => 0, 'programID' => 1],
                // ['userCode' => '10-A-00010', 'firstName' => 'EE', 'lastName' => 'Chair', 'email' => 'ee.chair@university.edu', 'roleID' => 3, 'campusID' => 1, 'isActive' => 0, 'programID' => 2],
                // ['userCode' => '10-A-00011', 'firstName' => 'ECE', 'lastName' => 'Chair', 'email' => 'ece.chair@university.edu', 'roleID' => 3, 'campusID' => 1, 'isActive' => 1, 'programID' => 4],
                
                // // Faculty
                // ['userCode' => '10-A-00100', 'firstName' => 'CE', 'lastName' => 'Faculty', 'email' => 'ce.faculty@university.edu', 'roleID' => 2, 'campusID' => 1, 'isActive' => 1, 'programID' => 3],
                // ['userCode' => '10-A-00101', 'firstName' => 'CPE', 'lastName' => 'Faculty', 'email' => 'cpe.faculty@university.edu', 'roleID' => 2, 'campusID' => 1, 'isActive' => 0, 'programID' => 1],
                // ['userCode' => '10-A-00110', 'firstName' => 'EE', 'lastName' => 'Faculty', 'email' => 'ee.faculty@university.edu', 'roleID' => 2, 'campusID' => 1, 'isActive' => 0, 'programID' => 2],
                // ['userCode' => '10-A-00111', 'firstName' => 'ECE', 'lastName' => 'Faculty', 'email' => 'ece.faculty@university.edu', 'roleID' => 2, 'campusID' => 1, 'isActive' => 1, 'programID' => 4],

                // // Students
                // ['userCode' => '10-A-01000', 'firstName' => 'CE', 'lastName' => 'Student', 'email' => 'ce.student@university.edu', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 3],
                // ['userCode' => '10-A-01001', 'firstName' => 'CPE', 'lastName' => 'Student', 'email' => 'cpe.student@university.edu', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 1],
                // ['userCode' => '10-A-01010', 'firstName' => 'EE', 'lastName' => 'Student', 'email' => 'ee.student@university.edu', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 2],
                // ['userCode' => '10-A-01011', 'firstName' => 'ECE', 'lastName' => 'Student', 'email' => 'ece.student@university.edu', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 4],

                // // Test accounts
                // ['userCode' => '10-A-01110', 'firstName' => 'Testoooo hahhaa', 'lastName' => 'Teroonn', 'email' => 'testtTer@gmail.com', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 1],
                // ['userCode' => '10-A-01120', 'firstName' => 'Testtt teerrr', 'lastName' => 'Teeerr', 'email' => 'TeessttTeerr@gmail.com', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 1],
                // ['userCode' => '10-A-01230', 'firstName' => 'Test', 'lastName' => 'Ter', 'email' => 'testTer@gmail.com', 'roleID' => 1, 'campusID' => 1, 'isActive' => 1, 'programID' => 1],

                // // Admin/Deans
                // ['userCode' => '10-A-02087', 'firstName' => 'Associate', 'lastName' => 'Dean', 'email' => 'associate.dean@university.edu', 'roleID' => 5, 'campusID' => 1, 'isActive' => 1, 'programID' => 4],
                // ['userCode' => '10-A-12345', 'firstName' => 'Dean', 'lastName' => 'Account', 'email' => 'dean.account@university.edu', 'roleID' => 4, 'campusID' => 1, 'isActive' => 1, 'programID' => 4],
            ];

            foreach ($users as $userData) {
                DB::table('users')->updateOrInsert(
                    ['userCode' => $userData['userCode']], // Unique identifier
                    array_merge($userData, [
                        'password' => Hash::make('password123'), // Default password for all
                        'status_id' => $registeredStatusId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                );
            }

            $this->command->info('Successfully seeded users from the table!');

        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
        }
    }
}