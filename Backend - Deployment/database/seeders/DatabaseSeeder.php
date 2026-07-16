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
require_once base_path('database/seeders/FeatureTablesSeeder.php');
require_once base_path('Modules/PersonalExams/Database/Seeders/QuizTypeSeeder.php');
require_once base_path('Modules/Semester/Database/Seeders/SemesterSeeder.php');
require_once base_path('Modules/Achievements/Database/Seeders/AchievementSeeder.php');
require_once base_path('Modules/Analytics/Database/Seeders/AnalyticsSeeder.php');
require_once base_path('Modules/Support/Database/Seeders/SupportSeeder.php');
require_once base_path('Modules/Notifications/Database/Seeders/NotificationSeeder.php');
require_once base_path('database/seeders/LessonSeeder.php');
require_once base_path('database/seeders/AnalyticsTestSeeder.php');
require_once base_path('database/seeders/PopulateEmptyTablesSeeder.php');


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
            \Database\Seeders\DemoLeaderboardSeeder::class,
            
            // 7. Personal Exams (Quiz Types)
            \Modules\PersonalExams\Database\Seeders\QuizTypeSeeder::class,
            
            // 8. Semester
            \Modules\Semester\Database\Seeders\SemesterSeeder::class,
            
            // 9. New modules
            \Modules\Achievements\Database\Seeders\AchievementSeeder::class,
            \Modules\Analytics\Database\Seeders\AnalyticsSeeder::class,
            \Modules\Support\Database\Seeders\SupportSeeder::class,
            \Modules\Notifications\Database\Seeders\NotificationSeeder::class,

            // 10. Lessons (needs subjects first)
            \Database\Seeders\LessonSeeder::class,

            // 11. Feature tables from database/migrations
            \Database\Seeders\FeatureTablesSeeder::class,

            // 12. Analytics test data (provides sample exam analytics)
            \Database\Seeders\AnalyticsTestSeeder::class,

            // 13. Populate empty tables (classes, quizzes, student records, etc.)
            \Database\Seeders\PopulateEmptyTablesSeeder::class,
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
