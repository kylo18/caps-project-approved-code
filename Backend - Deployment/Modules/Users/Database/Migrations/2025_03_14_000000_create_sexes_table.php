<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        Schema::create('sexes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 10)->unique();
            $table->timestamps();
        });

        // Insert default values
        DB::table('sexes')->insert([
            ['name' => 'MALE', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'FEMALE', 'created_at' => now(), 'updated_at' => now()]
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('sexes');
    }
}; 