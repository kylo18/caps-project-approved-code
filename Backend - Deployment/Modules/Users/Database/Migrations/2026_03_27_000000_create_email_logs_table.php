<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('email');
            $table->string('type'); // e.g., 'approved', 'disapproved', 'registration'
            $table->string('status'); // 'success' or 'failed'
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamps();

            $table->foreign('user_id')->references('userID')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('email_logs');
    }
};
