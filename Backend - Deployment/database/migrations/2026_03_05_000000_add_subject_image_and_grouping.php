<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Stores a relative path to the image, e.g. subjects/filename.jpg
            // Grouping (Calculus 1 + 2 → Calculus) is done via regex in PHP, not a DB column
            $table->string('subjectImage')->nullable()->after('subjectName');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('subjectImage');
        });
    }
};
