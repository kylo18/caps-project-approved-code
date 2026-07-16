<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('token', 500)->unique();
            $table->string('platform', 20);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')
                ->references('userID')
                ->on('users')
                ->onDelete('cascade');

            $table->index('user_id', 'idx_push_tokens_user');
            $table->index('last_used_at', 'idx_push_tokens_last_used');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
    }
};
