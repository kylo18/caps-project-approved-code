<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sub_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_type_id')->constrained('issue_types')->onDelete('cascade');
            $table->string('sub_option'); // e.g., "App not loading"
            $table->integer('sort_order')->default(0); // For ordering
            $table->timestamps();
            
            $table->unique(['issue_type_id', 'sub_option'], 'sub_option_unique');
            $table->index('issue_type_id');
            $table->index('sub_option');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sub_options');
    }
};
