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
             * DEFAULT USERS (UNCHANGED)
             * ============================
             */
            $users = [
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

            DB::table('users')->insert($users);

            /**
             * ============================
             * ADDITIONAL USERS (50 ONLY)
             * ============================
             */
            $roles = [2, 3, 4];
            $campuses = [1, 2];
            $programs = [1, 2, 3, 4, 5];
            $firstNames = ['James', 'John', 'Robert', 'Michael', 'William'];
            $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];

            $chunkSize = 25;
            $totalUsers = 50;
            $bulkUsers = [];

            for ($i = 1; $i <= $totalUsers; $i++) {
                $userCode = "23-A-" . str_pad($i + 20000, 5, '0', STR_PAD_LEFT);

                $firstName = $firstNames[array_rand($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];

                $bulkUsers[] = [
                    'userCode' => $userCode,
                    'firstName' => $firstName,
                    'lastName' => $lastName,
                    'email' => strtolower("{$firstName}.{$lastName}{$i}@university.edu"),
                    'password' => Hash::make('12345678'),
                    'roleID' => $roles[array_rand($roles)],
                    'campusID' => $campuses[array_rand($campuses)],
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => $programs[array_rand($programs)],
                ];

                if (count($bulkUsers) >= $chunkSize) {
                    DB::table('users')->insert($bulkUsers);
                    $bulkUsers = [];
                }
            }

            if (!empty($bulkUsers)) {
                DB::table('users')->insert($bulkUsers);
            }

            $this->command->info(
                'Successfully seeded ' . (count($users) + $totalUsers) . ' users!'
            );

        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
            throw $e;
        }
    }
}