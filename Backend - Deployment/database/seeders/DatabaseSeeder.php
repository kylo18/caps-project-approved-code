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
//require_once base_path('Modules/Subjects/Database/Seeders/SubjectsTableSeeder.php');
require_once base_path('Modules/Subjects/Database/Seeders/YearLevelsTableSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/CoverageSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/DifficultySeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/PurposeSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/StatusSeeder.php');
//require_once base_path('Modules/Questions/Database/Seeders/QuestionsTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/StudentsTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/SexesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/CurriculumSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/RemarksSeeder.php');


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        $seeders = [
            \Modules\Users\Database\Seeders\RolesTableSeeder::class,
            \Modules\Users\Database\Seeders\CampusesTableSeeder::class,
            \Modules\Users\Database\Seeders\ProgramSeeder::class,
            \Modules\Questions\Database\Seeders\StatusSeeder::class,
            \Modules\Users\Database\Seeders\SexesTableSeeder::class,
            \Modules\Users\Database\Seeders\UsersTableSeeder::class,
            \Modules\Subjects\Database\Seeders\YearLevelsTableSeeder::class,
            //\Modules\Subjects\Database\Seeders\SubjectsTableSeeder::class,
            \Modules\Questions\Database\Seeders\CoverageSeeder::class,
            \Modules\Questions\Database\Seeders\DifficultySeeder::class,
            \Modules\Questions\Database\Seeders\PurposeSeeder::class,
            //\Modules\Questions\Database\Seeders\QuestionsTableSeeder::class,
            \Modules\Users\Database\Seeders\StudentsTableSeeder::class,
            \Modules\Users\Database\Seeders\CurriculumSeeder::class,
            \Modules\Users\Database\Seeders\RemarksSeeder::class,
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

        Schema::enableForeignKeyConstraints();
    }
}
