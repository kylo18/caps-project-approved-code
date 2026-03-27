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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index(); // 3. Indexing
            $table->string('issue_type')->index();       // 3. Indexing for fast filtering
            $table->string('subject');
            $table->text('message');
            $table->string('status')->default('Open')->index();
            $table->timestamps();
            $table->softDeletes(); // 9. Soft Deletes

            // 2. Proper Relationships & 4. Data Integrity
            $table->foreign('user_id')
                  ->references('userID')
                  ->on('users')
                  ->onDelete('cascade');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
