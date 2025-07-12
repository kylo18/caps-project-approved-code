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
                [
                    'userCode' => '24-A-01850',
                    'firstName' => 'Student1',
                    'lastName' => 'Test',
                    'email' => 'student1@example.com',
                    'password' => Hash::make('password1'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '24-A-01312',
                    'firstName' => 'Student2',
                    'lastName' => 'Test',
                    'email' => 'student2@example.com',
                    'password' => Hash::make('password2'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00359',
                    'firstName' => 'Student3',
                    'lastName' => 'Test',
                    'email' => 'student3@example.com',
                    'password' => Hash::make('password3'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-02087',
                    'firstName' => 'Student4',
                    'lastName' => 'Test',
                    'email' => 'student4@example.com',
                    'password' => Hash::make('password4'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00005',
                    'firstName' => 'Student5',
                    'lastName' => 'Test',
                    'email' => 'student5@example.com',
                    'password' => Hash::make('password5'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00006',
                    'firstName' => 'Student6',
                    'lastName' => 'Test',
                    'email' => 'student6@example.com',
                    'password' => Hash::make('password6'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00007',
                    'firstName' => 'Student7',
                    'lastName' => 'Test',
                    'email' => 'student7@example.com',
                    'password' => Hash::make('password7'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00008',
                    'firstName' => 'Student8',
                    'lastName' => 'Test',
                    'email' => 'student8@example.com',
                    'password' => Hash::make('password8'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00009',
                    'firstName' => 'Student9',
                    'lastName' => 'Test',
                    'email' => 'student9@example.com',
                    'password' => Hash::make('password9'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ],
                [
                    'userCode' => '23-A-00010',
                    'firstName' => 'Student10',
                    'lastName' => 'Test',
                    'email' => 'student10@example.com',
                    'password' => Hash::make('password10'),
                    'roleID' => 1,
                    'campusID' => 1,
                    'isActive' => true,
                    'status_id' => $registeredStatusId,
                    'programID' => 1
                ]
            ];

            // Insert the 10 student users
            DB::table('users')->insert($users);
        } catch (\Exception $e) {
            $this->command->error('Failed to seed users: ' . $e->getMessage());
            throw $e;
        }
    }
}
