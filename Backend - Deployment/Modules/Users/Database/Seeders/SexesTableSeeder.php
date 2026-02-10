<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SexesTableSeeder extends Seeder
{
    public function run()
    {
        // Disable foreign key checks to avoid issues with existing constraints
        Schema::disableForeignKeyConstraints();

        // Truncate the table before seeding to clear existing data
        DB::table('sexes')->truncate();

        // Insert the default sex options
        DB::table('sexes')->insert([
            [
                'name' => 'MALE',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'FEMALE',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }
} 