<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id('notificationID');
            $table->foreignId('userID')->constrained('users', 'userID')->onDelete('cascade');
            $table->text('message');
            $table->string('type', 50);
            $table->boolean('isRead')->default(false);
            $table->timestamp('sentAt')->useCurrent();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
};
