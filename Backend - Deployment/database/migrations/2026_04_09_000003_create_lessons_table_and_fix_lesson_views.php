<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates a proper `lessons` table and adds foreign keys from
     * lesson_views.lesson_id and lesson_views.course_id so that
     * analytics can display real lesson titles instead of "Lesson #N".
     *
     * Each subject automatically gets a default lesson during seeding.
     */
    public function up(): void
    {
        // 1. Create lessons table
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->foreignId('subject_id')
                  ->nullable()
                  ->constrained('subjects', 'subjectID')
                  ->nullOnDelete();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('subject_id', 'idx_lessons_subject');
            $table->index('is_active', 'idx_lessons_active');
        });

        // 2. Create a default lesson for every existing subject
        $subjects = DB::table('subjects')->get();
        foreach ($subjects as $subject) {
            DB::table('lessons')->insert([
                'title' => $subject->subjectName . ' — Overview',
                'subject_id' => $subject->subjectID,
                'display_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Add FK from lesson_views.lesson_id → lessons.id
        //    First add a default lesson_id (1) to any NULL rows
        DB::table('lesson_views')
            ->whereNull('lesson_id')
            ->update(['lesson_id' => 1]);

        // Modify column to add FK constraint
        Schema::table('lesson_views', function (Blueprint $table) {
            $table->foreign('lesson_id')
                  ->references('id')
                  ->on('lessons')
                  ->onDelete('cascade');
        });

        // 4. Add FK from lesson_views.course_id → lessons.id (self-referential parent)
        //    Or set to NULL for orphaned rows first
        DB::table('lesson_views')
            ->whereNotIn('course_id', function ($q) { $q->select('id')->from('lessons'); })
            ->where('course_id', '>', 0)
            ->update(['course_id' => null]);

        Schema::table('lesson_views', function (Blueprint $table) {
            $table->unsignedBigInteger('course_id')->nullable()->change();
            $table->foreign('course_id')
                  ->references('id')
                  ->on('lessons')
                  ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop FKs first
        Schema::table('lesson_views', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropForeign(['lesson_id']);
        });

        Schema::dropIfExists('lessons');
    }
};
