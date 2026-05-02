<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->boolean('is_enabled_for_exam_questions')->default(true)->comment('Controls if exam questions (purpose_id 3) can be manipulated')->after('yearLevelID');
        });
    }

    public function down()
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('is_enabled_for_exam_questions');
        });
    }
}; 