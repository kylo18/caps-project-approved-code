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
        // Issue types table
        if (!Schema::hasTable('issue_types')) {
            Schema::create('issue_types', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique(); // Normalized name (e.g., "Technical Issue")
                $table->string('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                
                $table->index('name');
                $table->index('is_active');
            });
        }

        // Issue type variants table (for normalization)
        if (!Schema::hasTable('issue_type_variants')) {
            Schema::create('issue_type_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('issue_type_id')->constrained('issue_types')->onDelete('cascade');
                $table->string('variant'); // Raw input (e.g., "tech", "technical issue")
                $table->timestamps();
                
                $table->unique(['issue_type_id', 'variant'], 'issue_variant_unique');
                $table->index('variant');
            });
        }

        // Status normalization table
        if (!Schema::hasTable('status_standardization')) {
            Schema::create('status_standardization', function (Blueprint $table) {
                $table->id();
                $table->string('normalized_name'); // Normalized status (e.g., "In Progress")
                $table->string('description')->nullable();
                $table->boolean('is_default')->default(false);
                $table->timestamps();
                
                $table->unique('normalized_name');
            });
        }

        // Status variants table (for normalization)
        if (!Schema::hasTable('status_variants')) {
            Schema::create('status_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('status_standardization_id')->constrained('status_standardization')->onDelete('cascade');
                $table->string('variant'); // Raw input (e.g., "inprogress", "working")
                $table->timestamps();
                
                $table->unique(['status_standardization_id', 'variant'], 'status_variant_unique');
                $table->index('variant');
            });
        }

        // Category normalization table
        if (!Schema::hasTable('category_standardization')) {
            Schema::create('category_standardization', function (Blueprint $table) {
                $table->id();
                $table->string('normalized_name'); // Normalized category (e.g., "Minor")
                $table->string('description')->nullable();
                $table->integer('priority')->default(0); // For ordering (1=Critical, 2=Major, 3=Minor)
                $table->timestamps();
                
                $table->unique('normalized_name');
                $table->index('priority');
            });
        }

        // Category variants table (for normalization)
        if (!Schema::hasTable('category_variants')) {
            Schema::create('category_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_standardization_id')->constrained('category_standardization')->onDelete('cascade');
                $table->string('variant'); // Raw input (e.g., "minor", "small")
                $table->timestamps();
                
                $table->unique(['category_standardization_id', 'variant'], 'cat_variant_unique');
                $table->index('variant');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_variants');
        Schema::dropIfExists('category_standardization');
        Schema::dropIfExists('status_variants');
        Schema::dropIfExists('status_standardization');
        Schema::dropIfExists('issue_type_variants');
        Schema::dropIfExists('issue_types');
    }
};
