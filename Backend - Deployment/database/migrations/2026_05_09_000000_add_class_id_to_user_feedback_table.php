<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('user_feedback', function (Blueprint $table) {
            $table->unsignedBigInteger('class_id')->nullable()->after('user_id');
            // Note: The classes table uses classID as primary key based on ClassModel.php analysis
            $table->foreign('class_id')->references('classID')->on('classes')->onDelete('set null');
            $table->index('class_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('user_feedback', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropColumn('class_id');
        });
    }
};
