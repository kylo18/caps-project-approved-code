<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seed_progress', function (Blueprint $table) {
            $table->string('task', 100)->primary();
            $table->unsignedBigInteger('last_id')->default(0);
            $table->timestamp('updated_at')->nullable();
            $table->text('metadata')->nullable(); // JSON for extra state
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seed_progress');
    }
};