<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

require_once base_path('Modules/Users/Database/Seeders/RolesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/CampusesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/UsersTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/ProgramSeeder.php');
require_once base_path('Modules/Subjects/Database/Seeders/SubjectsTableSeeder.php');

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('users')->truncate();

        $seeders = [
            \Modules\Users\Database\Seeders\RolesTableSeeder::class,
            \Modules\Users\Database\Seeders\CampusesTableSeeder::class,
            \Modules\Users\Database\Seeders\UsersTableSeeder::class,
            \Modules\Users\Database\Seeders\ProgramSeeder::class,
            \Modules\Subjects\Database\Seeders\SubjectsTableSeeder::class,
        ];

        foreach ($seeders as $seeder) {
            try {
                $this->call($seeder);
                echo "Seeded: {$seeder}\n";
            } catch (\Exception $e) {
                Log::error("Seeding failed for {$seeder}", [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                echo "Failed to seed: {$seeder} (check logs)\n";
            }
        }
    }
}
