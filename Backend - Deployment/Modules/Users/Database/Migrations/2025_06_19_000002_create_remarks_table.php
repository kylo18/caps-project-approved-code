<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('remarks', function (Blueprint $table) {
            $table->id();
            $table->enum('remarksType', ['Regular', 'Probationary', 'Advised to Shift']);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('remarks');
    }
}; 