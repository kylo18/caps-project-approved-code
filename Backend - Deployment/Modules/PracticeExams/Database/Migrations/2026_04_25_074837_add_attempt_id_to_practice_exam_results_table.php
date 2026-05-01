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
        Schema::table('practice_exam_results', function (Blueprint $table) {
            $table->unsignedBigInteger('attempt_id')->nullable()->after('resultID');
            $table->foreign('attempt_id')
                  ->references('id')
                  ->on('exam_attempts')
                  ->onDelete('set null');
            $table->index('attempt_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('practice_exam_results', function (Blueprint $table) {
            $table->dropForeign(['attempt_id']);
            $table->dropIndex(['attempt_id']);
            $table->dropColumn('attempt_id');
        });
    }
};
