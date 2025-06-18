<?php

// Test script to verify storage access and file paths
require_once 'vendor/autoload.php';

// Initialize Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;

echo "Testing Storage Access...\n\n";

// Test 1: Check if storage link exists
$storageLink = public_path('storage');
if (is_link($storageLink)) {
    echo "✓ Storage link exists at: $storageLink\n";
} else {
    echo "✗ Storage link does not exist at: $storageLink\n";
}

// Test 2: Check choices directory
$choicesDir = public_path('storage/choices');
if (is_dir($choicesDir)) {
    echo "✓ Choices directory exists at: $choicesDir\n";
    $choiceFiles = glob($choicesDir . '/*');
    echo "  Found " . count($choiceFiles) . " files in choices directory\n";
} else {
    echo "✗ Choices directory does not exist at: $choicesDir\n";
}

// Test 3: Check question_images directory
$questionImagesDir = public_path('storage/question_images');
if (is_dir($questionImagesDir)) {
    echo "✓ Question images directory exists at: $questionImagesDir\n";
    $imageFiles = glob($questionImagesDir . '/*');
    echo "  Found " . count($imageFiles) . " files in question_images directory\n";
} else {
    echo "✗ Question images directory does not exist at: $questionImagesDir\n";
}

// Test 4: Check logo files
$univLogo = public_path('univLogo.png.jpg');
$collegeLogo = public_path('college-logo.png.jpg');

if (file_exists($univLogo)) {
    echo "✓ University logo exists at: $univLogo\n";
} else {
    echo "✗ University logo does not exist at: $univLogo\n";
}

if (file_exists($collegeLogo)) {
    echo "✓ College logo exists at: $collegeLogo\n";
} else {
    echo "✗ College logo does not exist at: $collegeLogo\n";
}

// Test 5: Test Storage facade
try {
    $disk = Storage::disk('public');
    echo "✓ Storage facade is working\n";
    
    // Test if we can list files
    $files = $disk->files('choices');
    echo "  Found " . count($files) . " files in storage/choices\n";
    
    $files = $disk->files('question_images');
    echo "  Found " . count($files) . " files in storage/question_images\n";
    
} catch (Exception $e) {
    echo "✗ Storage facade error: " . $e->getMessage() . "\n";
}

echo "\nTest completed.\n"; 