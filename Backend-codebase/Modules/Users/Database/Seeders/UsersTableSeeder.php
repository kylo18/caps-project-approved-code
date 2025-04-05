<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('users')->insert([
            [
                'userCode' => '23-A-02087',
                'firstName' => 'Kent',
                'lastName' => 'Apat',
                'email' => 'kentapat123@gmail.com',
                'password' => Hash::make('Kent'),
                'roleID' => 1,
                'campusID' => 1,
                'isActive' => true,
                'status' => 'registered',
                'programID' => 1
            ],
            [
                'userCode' => '23-A-00926',
                'firstName' => 'Carlos Miguel',
                'lastName' => 'Sabijon',
                'email' => 'carlossabijon04@gmail.com',
                'password' => Hash::make('Sabijon'),
                'roleID' => 1,
                'campusID' => 1,
                'isActive' => true,
                'status' => 'registered',
                'programID' => 1
            ],
            [
                'userCode' => '23-A-00359',
                'firstName' => 'Vincent Carl',
                'lastName' => 'Tan',
                'email' => 'vincentcarltan2@gmail.com',
                'password' => Hash::make('Tan'),
                'roleID' => 1,
                'campusID' => 1,
                'isActive' => true,
                'status' => 'registered',
                'programID' => 1
            ],
            [
                'userCode' => '23-A-00419',
                'firstName' => 'Darjay Roy',
                'lastName' => 'Ebao',
                'email' => 'unknowndj003@gmail.com',
                'password' => Hash::make('Darj1414'),
                'roleID' => 1,
                'campusID' => 1,
                'isActive' => true,
                'status' => 'registered',
                'programID' => 1
            ],
            [
                'userCode' => '23-A-12345',
                'firstName' => 'Jeopel Glenn',
                'lastName' => 'Binoya',
                'email' => 'jeopel@gmail.com',
                'password' => Hash::make('12345678'),
                'roleID' => 4,
                'campusID' => 1,
                'isActive' => true,
                'status' => 'registered',
                'programID' => 1
            ]
        ]);
    }
}
