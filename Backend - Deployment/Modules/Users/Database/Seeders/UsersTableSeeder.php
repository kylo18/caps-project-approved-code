<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run()
    {
        // Get status ID for registered users
        $registeredStatusId = DB::table('statuses')
            ->where('name', 'registered')
            ->first()
            ->id;

        DB::table('users')->insert([
            [
                'userCode' => '23-A-02087',
                'firstName' => 'Gillert',
                'lastName' => 'Bongcac',
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
                'status_id' => 1,
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
        ]);
    }
}
