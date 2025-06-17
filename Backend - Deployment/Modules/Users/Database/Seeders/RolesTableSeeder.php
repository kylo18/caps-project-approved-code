<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RolesTableSeeder extends Seeder
{
    public function run()
    {
        // Disable foreign key checks (Avoids issues with existing constraints)
        Schema::disableForeignKeyConstraints();

        // Truncate the table before seeding (Clears existing data)
        DB::table('roles')->truncate();

        // Insert roles
        DB::table('roles')->insert([
            ['roleName' => 'Student'],
            ['roleName' => 'Instructor'],
            ['roleName' => 'Program Chair'],
            ['roleName' => 'Dean'],
            ['roleName' => 'Associate Dean'],
        ]);

        // Enable foreign key checks again
        Schema::enableForeignKeyConstraints();
    }
}
