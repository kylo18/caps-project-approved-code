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
        Schema::table('personal_quiz_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('personal_quiz_settings', 'showCorrectQuestion')) {
                $table->boolean('showCorrectQuestion')->default(false)->after('showCorrectAnswers');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_quiz_settings', function (Blueprint $table) {
            if (Schema::hasColumn('personal_quiz_settings', 'showCorrectQuestion')) {
                $table->dropColumn('showCorrectQuestion');
            }
        });
    }
};

