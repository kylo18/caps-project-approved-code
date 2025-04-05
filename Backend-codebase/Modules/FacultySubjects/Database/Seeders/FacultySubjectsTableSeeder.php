<?php

namespace Modules\FacultySubjects\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FacultySubjectsTableSeeder extends Seeder
{
    public function run()
    {
         // Disable foreign key checks (Avoids issues with existing constraints)
         Schema::disableForeignKeyConstraints();

         // Truncate the table before seeding (Clears existing data)
         DB::table('faculty_subjects')->truncate();
    }
}
