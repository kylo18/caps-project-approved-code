<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require_once base_path('Modules/Users/Database/Seeders/RolesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/CampusesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/UsersTableSeeder.php');
require_once base_path('Modules/Subjects/Database/Seeders/SubjectsTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/ProgramSeeder.php');


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks (Avoids issues with existing constraints)
        Schema::disableForeignKeyConstraints();

        // Truncate the table before seeding (Clears existing data)
        DB::table('users')->truncate();
        $this->call([
            \Modules\Users\Database\Seeders\RolesTableSeeder::class,
            \Modules\Users\Database\Seeders\CampusesTableSeeder::class,
            \Modules\Users\Database\Seeders\UsersTableSeeder::class,
            \Modules\Subjects\Database\Seeders\SubjectsTableSeeder::class,
            \Modules\Users\Database\Seeders\ProgramSeeder::class,
        ]);
    }
}
