<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Redis cache warm-up config table
        Schema::create('cache_warmup_config', function (Blueprint $table) {
            $table->id();
            $table->string('cache_key', 255)->unique();
            $table->string('description', 255);
            $table->integer('ttl_seconds')->default(300);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_warmed_at')->nullable();
            $table->timestamps();
        });

        // Insert default cache warm-up entries
        DB::table('cache_warmup_config')->insert([
            [
                'cache_key' => 'leaderboard:subject:{id}:top100',
                'description' => 'Top 100 users per subject leaderboard',
                'ttl_seconds' => 300,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cache_key' => 'analytics:user:{uid}:correct_rate',
                'description' => 'User overall correct answer rate',
                'ttl_seconds' => 600,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'cache_key' => 'subjects:program:{pid}:list',
                'description' => 'Subject list per program',
                'ttl_seconds' => 3600,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('cache_warmup_config');
    }
};