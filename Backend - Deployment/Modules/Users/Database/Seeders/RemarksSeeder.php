<?php

namespace Modules\Users\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RemarksSeeder extends Seeder
{
    public function run()
    {
        DB::table('remarks')->insert([
            ['remarksType' => 'Regular'],
            ['remarksType' => 'Probationary'],
            ['remarksType' => 'Advised to Shift'],
        ]);
    }
} 