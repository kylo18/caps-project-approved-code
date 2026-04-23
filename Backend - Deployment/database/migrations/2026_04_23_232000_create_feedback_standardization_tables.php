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
        Schema::create('issue_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Normalized name (e.g., "Technical Issue")
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('name');
            $table->index('is_active');
        });

        // Issue type variants table (for normalization)
        Schema::create('issue_type_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_type_id')->constrained('issue_types')->onDelete('cascade');
            $table->string('variant'); // Raw input (e.g., "tech", "technical issue")
            $table->timestamps();
            
            $table->unique(['issue_type_id', 'variant'], 'issue_variant_unique');
            $table->index('variant');
        });

        // Subject normalization table
        Schema::create('subject_normalization', function (Blueprint $table) {
            $table->id();
            $table->string('normalized_name'); // Normalized subject name (e.g., "Database Systems")
            $table->string('description')->nullable();
            $table->timestamps();
            
            $table->unique('normalized_name');
        });

        // Subject variants table (for normalization)
        Schema::create('subject_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_normalization_id')->constrained('subject_normalization')->onDelete('cascade');
            $table->string('variant'); // Raw input (e.g., "DB SYSTEMS", "DB Sys")
            $table->timestamps();
            
            $table->unique(['subject_normalization_id', 'variant'], 'sub_variant_unique');
            $table->index('variant');
        });

        // Subject - Issue Type relationship table
        Schema::create('subject_issue_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_normalization_id')->constrained('subject_normalization')->onDelete('cascade');
            $table->foreignId('issue_type_id')->constrained('issue_types')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['subject_normalization_id', 'issue_type_id'], 'sub_issue_unique');
        });

        // Status normalization table
        Schema::create('status_normalization', function (Blueprint $table) {
            $table->id();
            $table->string('normalized_name'); // Normalized status (e.g., "In Progress")
            $table->string('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            $table->unique('normalized_name');
        });

        // Status variants table (for normalization)
        Schema::create('status_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('status_normalization_id')->constrained('status_normalization')->onDelete('cascade');
            $table->string('variant'); // Raw input (e.g., "inprogress", "working")
            $table->timestamps();
            
            $table->unique(['status_normalization_id', 'variant'], 'status_variant_unique');
            $table->index('variant');
        });

        // Category normalization table
        Schema::create('category_normalization', function (Blueprint $table) {
            $table->id();
            $table->string('normalized_name'); // Normalized category (e.g., "Minor")
            $table->string('description')->nullable();
            $table->integer('priority')->default(0); // For ordering (1=Critical, 2=Major, 3=Minor)
            $table->timestamps();
            
            $table->unique('normalized_name');
            $table->index('priority');
        });

        // Category variants table (for normalization)
        Schema::create('category_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_normalization_id')->constrained('category_normalization')->onDelete('cascade');
            $table->string('variant'); // Raw input (e.g., "minor", "small")
            $table->timestamps();
            
            $table->unique(['category_normalization_id', 'variant'], 'cat_variant_unique');
            $table->index('variant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_variants');
        Schema::dropIfExists('category_normalization');
        Schema::dropIfExists('status_variants');
        Schema::dropIfExists('status_normalization');
        Schema::dropIfExists('subject_issue_types');
        Schema::dropIfExists('subject_variants');
        Schema::dropIfExists('subject_normalization');
        Schema::dropIfExists('issue_type_variants');
        Schema::dropIfExists('issue_types');
    }
};
