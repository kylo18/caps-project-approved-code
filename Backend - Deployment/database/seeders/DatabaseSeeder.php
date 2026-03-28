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
require_once base_path('Modules/Subjects/Database/Seeders/YearLevelsTableSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/CoverageSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/DifficultySeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/PurposeSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/StatusSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/QuestionsTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/StudentsTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/SexesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/CurriculumSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/RemarksSeeder.php');
require_once base_path('Modules/PracticeExams/Database/Seeders/LeaderboardDummyDataSeeder.php');
require_once base_path('Modules/Analytics/Database/Seeders/AnalyticsSeeder.php');
require_once base_path('Modules/Achievements/Database/Seeders/AchievementSeeder.php');
require_once base_path('Modules/Support/Database/Seeders/SupportSeeder.php');
require_once base_path('Modules/Notifications/Database/Seeders/NotificationSeeder.php');


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        $seeders = [
            // 1. Core tables first (no dependencies)
            \Modules\Users\Database\Seeders\RolesTableSeeder::class,
            \Modules\Users\Database\Seeders\CampusesTableSeeder::class,
            \Modules\Users\Database\Seeders\ProgramSeeder::class,
            
            // 2. Status must seed BEFORE UsersTableSeeder
            \Modules\Questions\Database\Seeders\StatusSeeder::class,
            \Modules\Users\Database\Seeders\SexesTableSeeder::class,
            
            // 3. Users (depends on statuses)
            \Modules\Users\Database\Seeders\UsersTableSeeder::class,
            
            // 4. Subjects and questions
            \Modules\Subjects\Database\Seeders\YearLevelsTableSeeder::class,
            \Modules\Subjects\Database\Seeders\SubjectsTableSeeder::class,
            \Modules\Questions\Database\Seeders\CoverageSeeder::class,
            \Modules\Questions\Database\Seeders\DifficultySeeder::class,
            \Modules\Questions\Database\Seeders\PurposeSeeder::class,
            \Modules\Questions\Database\Seeders\QuestionsTableSeeder::class,
            
            // 5. Student data (creates users from CSV)
            \Modules\Users\Database\Seeders\StudentsTableSeeder::class,
            \Modules\Users\Database\Seeders\CurriculumSeeder::class,
            \Modules\Users\Database\Seeders\RemarksSeeder::class,
            
            // 6. Practice exams (needs users and subjects)
            \Modules\PracticeExams\Database\Seeders\LeaderboardDummyDataSeeder::class,
            
            // 7. NEW FEATURES - runs AFTER students exist
            \Modules\Analytics\Database\Seeders\AnalyticsSeeder::class,
            \Modules\Achievements\Database\Seeders\AchievementSeeder::class,
            \Modules\Support\Database\Seeders\SupportSeeder::class,
            \Modules\Notifications\Database\Seeders\NotificationSeeder::class,
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
