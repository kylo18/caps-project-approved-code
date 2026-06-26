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
            $status = DB::table('statuses')->where('name', 'registered')->first();
            $registeredStatusId = $status ? $status->id : 4;
            $defaultPassword = Hash::make('password123');

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
                    'userCode' => '10-A-02087',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => '10-A-02087@caps.local',
                    'roleID' => 5,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],
                [
                    'userCode' => '10-A-00000',
                    'firstName' => 'CE',
                    'lastName' => 'Chair',
                    'email' => '10-A-00000@caps.local',
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 3,
                ],
                [
                    'userCode' => '10-A-00001',
                    'firstName' => 'CPE',
                    'lastName' => 'Chair',
                    'email' => '10-A-00001@caps.local',
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 1,
                ],
                [
                    'userCode' => '10-A-00010',
                    'firstName' => 'EE',
                    'lastName' => 'Chair',
                    'email' => '10-A-00010@caps.local',
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 2,
                ],
                [
                    'userCode' => '10-A-00011',
                    'firstName' => 'ECE',
                    'lastName' => 'Chair',
                    'email' => '10-A-00011@caps.local',
                    'roleID' => 3,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],
                [
                    'userCode' => '10-A-00100',
                    'firstName' => 'CE',
                    'lastName' => 'Faculty',
                    'email' => '10-A-00100@caps.local',
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 3,
                ],
                [
                    'userCode' => '10-A-00101',
                    'firstName' => 'CPE',
                    'lastName' => 'Faculty',
                    'email' => '10-A-00101@caps.local',
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 1,
                ],
                [
                    'userCode' => '10-A-00110',
                    'firstName' => 'EE',
                    'lastName' => 'Faculty',
                    'email' => '10-A-00110@caps.local',
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 2,
                ],
                [
                    'userCode' => '10-A-00111',
                    'firstName' => 'ECE',
                    'lastName' => 'Faculty',
                    'email' => '10-A-00111@caps.local',
                    'roleID' => 2,
                    'campusID' => 1,
                    'isActive' => 1,
                    'programID' => 4,
                ],

                // Katipunan Campus Accounts
                [
                    'userCode' => 'KT-A-00000',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => 'KT-A-00000@caps.local',
                    'roleID' => 5,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => 'KT-A-00001',
                    'firstName' => 'Program',
                    'lastName' => 'Chair',
                    'email' => 'KT-A-00001@caps.local',
                    'roleID' => 3,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => 'KT-A-00010',
                    'firstName' => 'Faculty',
                    'lastName' => 'Member',
                    'email' => 'KT-A-00010@caps.local',
                    'roleID' => 2,
                    'campusID' => 2,
                    'isActive' => 1,
                    'programID' => 5,
                ],

                // Tampilisan Campus Accounts
                [
                    'userCode' => 'TC-A-00000',
                    'firstName' => 'Associate',
                    'lastName' => 'Dean',
                    'email' => 'TC-A-00000@caps.local',
                    'roleID' => 5,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => 'TC-A-00001',
                    'firstName' => 'Program',
                    'lastName' => 'Chair',
                    'email' => 'TC-A-00001@caps.local',
                    'roleID' => 3,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
                [
                    'userCode' => 'TC-A-00010',
                    'firstName' => 'Faculty',
                    'lastName' => 'Member',
                    'email' => 'TC-A-00010@caps.local',
                    'roleID' => 2,
                    'campusID' => 3,
                    'isActive' => 1,
                    'programID' => 5,
                ],
            ];

            foreach ($users as $userData) {
                DB::table('users')->updateOrInsert(
                    ['userCode' => $userData['userCode']],
                    array_merge($userData, [
                        'password' => $defaultPassword,
                        'status_id' => $registeredStatusId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                );
            }

            $this->command->info('Users table seeded successfully.');
        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
        }
    }
}
