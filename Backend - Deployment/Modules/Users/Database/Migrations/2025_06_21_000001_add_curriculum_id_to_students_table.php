<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedBigInteger('curriculumID')->nullable()->after('sex_id');
            $table->foreign('curriculumID')->references('id')->on('curriculum')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['curriculumID']);
            $table->dropColumn('curriculumID');
        });
    }
}; 