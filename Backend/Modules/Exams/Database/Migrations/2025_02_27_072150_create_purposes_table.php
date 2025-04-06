<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('purposes', function (Blueprint $table) {
            $table->id('purposeID'); // Primary Key
            $table->string('purposeName', 255)->unique(); // Purpose name
        });
    }

    public function down()
    {
        Schema::dropIfExists('purposes');
    }
};
