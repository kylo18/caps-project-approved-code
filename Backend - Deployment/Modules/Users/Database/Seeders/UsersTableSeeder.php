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
            // Retrieve the status ID for registered users; fallback to 4 if not found
            $status = DB::table('statuses')->where('name', 'registered')->first();
            $registeredStatusId = $status ? $status->id : 4;

            if (!$status) {
                throw new \Exception('Status "registered" not found in statuses table');
            }

            $registeredStatusId = $status->id;

            /**
             * ============================
             * DEFAULT USERS (UNCHANGED)
             * ============================
             */
            $users = [
                // Main Campus Accounts
                [
                    'userCode' => '10-A-12345',
                    'firstName' => 'Dean',
                    'lastName' => 'Main',
                    'email' => '10-A-12345@caps.local',
                    'roleID' => 4,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],
                [
                    'userCode' => '10-A-00000',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => '10-A-00000@caps.local',
                    'roleID' => 5,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],
                [
                    'userCode' => '10-A-00001',
                    'firstName' => 'Program',
                    'lastName' => 'Chair',
                    'email' => '10-A-00001@caps.local',
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],
                [
                    'userCode' => '10-A-00010',
                    'firstName' => 'Faculty',
                    'lastName' => 'Member',
                    'email' => '10-A-00010@caps.local',
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],

                // Katipunan Campus Accounts
                [
                    'userCode' => '10-A-00011',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => '10-A-00011@caps.local',
                    'roleID' => 5,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => '10-A-00100',
                    'firstName' => 'Program',
                    'lastName' => 'Chair',
                    'email' => '10-A-00100@caps.local',
                    'roleID' => 3,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => '10-A-00101',
                    'firstName' => 'Faculty',
                    'lastName' => 'Member',
                    'email' => '10-A-00101@caps.local',
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => '10-A-00110',
                    'firstName' => 'Student',
                    'lastName' => 'Member',
                    'email' => '10-A-00110@caps.local',
                    'roleID' => 1,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],

                // Tampilisan Campus Accounts
                [
                    'userCode' => '10-A-00111',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => '10-A-00111@caps.local',
                    'roleID' => 5,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => '10-A-01000',
                    'firstName' => 'Program',
                    'lastName' => 'Chair',
                    'email' => '10-A-01000@caps.local',
                    'roleID' => 3,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => '10-A-01001',
                    'firstName' => 'Faculty',
                    'lastName' => 'Member',
                    'email' => '10-A-01001@caps.local',
                    'roleID' => 2,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => '10-A-01010',
                    'firstName' => 'Student',
                    'lastName' => 'Member',
                    'email' => '10-A-01010@caps.local',
                    'roleID' => 1,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
            ];

            foreach ($users as $userData) {
                DB::table('users')->updateOrInsert(
                    ['userCode' => $userData['userCode']], // Unique identifier
                    array_merge($userData, [
                        'password' => Hash::make('capsadmin123'), // Default password
                        'status_id' => $registeredStatusId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                );
            }

            $this->command->info('Users table seeded successfully.');

        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
            throw $e;
        }
    }
}