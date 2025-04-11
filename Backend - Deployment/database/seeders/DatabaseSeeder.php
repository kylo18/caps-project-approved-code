<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require_once base_path('Modules/Roles/Database/Seeders/RolesTableSeeder.php');
require_once base_path('Modules/Campuses/Database/Seeders/CampusesTableSeeder.php');
require_once base_path('Modules/Users/Database/Seeders/UsersTableSeeder.php');
require_once base_path('Modules/Subjects/Database/Seeders/SubjectsTableSeeder.php');
require_once base_path('Modules\FacultySubjects\Database\Seeders\FacultySubjectsTableSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/QuestionsTableSeeder.php');
require_once base_path('Modules/Exams/Database/Seeders/ExamsTableSeeder.php');
require_once base_path('Modules/ExamQuestions/Database/Seeders/ExamQuestionsTableSeeder.php');
require_once base_path('Modules/Requests/Database/Seeders/RequestsTableSeeder.php');
require_once base_path('Modules/Questions/Database/Seeders/PurposeSeeder.php');
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
            \Modules\Roles\Database\Seeders\RolesTableSeeder::class,
            \Modules\Campuses\Database\Seeders\CampusesTableSeeder::class,
            \Modules\Users\Database\Seeders\UsersTableSeeder::class,
            \Modules\Subjects\Database\Seeders\SubjectsTableSeeder::class,
            \Modules\FacultySubjects\Database\Seeders\FacultySubjectsTableSeeder::class,
            \Modules\Questions\Database\Seeders\QuestionsTableSeeder::class,
            \Modules\Exams\Database\Seeders\ExamsTableSeeder::class,
            \Modules\ExamQuestions\Database\Seeders\ExamQuestionsTableSeeder::class,
            \Modules\Requests\Database\Seeders\RequestsTableSeeder::class,
            \Modules\Questions\Database\Seeders\PurposeSeeder::class,
            \Modules\Users\Database\Seeders\ProgramSeeder::class,
        ]);
    }
}
