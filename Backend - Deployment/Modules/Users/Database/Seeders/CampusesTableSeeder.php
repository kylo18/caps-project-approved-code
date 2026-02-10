<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CampusesTableSeeder extends Seeder
{
    public function run()
    {
        // Disable foreign key checks (Avoids issues with existing constraints)
        Schema::disableForeignKeyConstraints();

        // Truncate the table before seeding (Clears existing data)
        DB::table('campuses')->truncate();
        DB::table('campuses')->insert([
            ['campusName' => 'Main Campus'],
            ['campusName' => 'Katipunan Campus'],
            ['campusName' => 'Tampilisan Campus']
        ]);
    }
}
