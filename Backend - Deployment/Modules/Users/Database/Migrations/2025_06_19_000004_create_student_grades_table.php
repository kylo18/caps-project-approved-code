<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->string('userCode', 20);
            $table->string('lastName', 50);
            $table->string('firstName', 50);
            $table->string('middleName', 50)->nullable();
            $table->string('yearLevel', 10);
            $table->string('subjectCode', 20);
            $table->text('subjectDesc');
            $table->decimal('genAve', 5, 2)->nullable();
            $table->decimal('reEx', 5, 2)->nullable();
            $table->decimal('finalGrade', 5, 2)->nullable();
            $table->timestamps();
        });
        // Alter columns to utf8mb4/utf8mb4_unicode_ci to ensure special character support
        DB::statement("ALTER TABLE student_grades CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("ALTER TABLE student_grades MODIFY userCode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("ALTER TABLE student_grades MODIFY lastName VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("ALTER TABLE student_grades MODIFY firstName VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("ALTER TABLE student_grades MODIFY middleName VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("ALTER TABLE student_grades MODIFY yearLevel VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        DB::statement("ALTER TABLE student_grades MODIFY subjectCode VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    }

    public function down()
    {
        Schema::dropIfExists('student_grades');
    }
}; 