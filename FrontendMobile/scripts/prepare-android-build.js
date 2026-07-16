#!/usr/bin/env node

/**
 * Pre-build preparation script for Android APK builds.
 * Run this before `npx expo prebuild` to validate the environment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const requiredFiles = [
  'app.config.js',
  'assets/icon.png',
  'assets/adaptive-icon.png',
  'assets/splash-icon.png',
];

const warnings = [];
const errors = [];

console.log('CAPS Mobile Android Build Preparation\n');

// Check required files
requiredFiles.forEach((file) => {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required file: ${file}`);
  }
});

// Check for conflicting app.json
if (fs.existsSync(path.join(rootDir, 'app.json'))) {
  errors.push('Conflicting app.json found. Delete it and keep only app.config.js');
}

// Check for google-services.json (required for Firebase builds)
if (!fs.existsSync(path.join(rootDir, 'google-services.json'))) {
  warnings.push('Missing google-services.json — Android build will fail if using Firebase. See BUILD_SETUP.md Step 2.');
}

// Check for keystore (only needed for release builds)
const hasKeystore = fs.readdirSync(rootDir).some((f) => f.endsWith('.keystore') || f.endsWith('.jks'));
if (!hasKeystore) {
  warnings.push('No signing keystore found. Debug builds will still work, but release builds require one. See BUILD_SETUP.md Step 5.');
}

// Check API_URL environment variable
const apiUrl = process.env.API_URL;
if (!apiUrl) {
  warnings.push('API_URL environment variable is not set. The app will use the fallback URL from app.config.js.');
} else {
  console.log(`API_URL: ${apiUrl}`);
}

// Run expo-doctor
console.log('\nRunning expo-doctor...\n');
try {
  execSync('npx expo-doctor', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  warnings.push('expo-doctor reported issues. Fix them before running prebuild.');
}

// Report results
console.log('\n--- Validation Results ---\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('All checks passed. You can now run:');
  console.log('  npx expo prebuild --clean');
  console.log('Then open the android/ folder in Android Studio.');
} else {
  if (errors.length > 0) {
    console.log('ERRORS (must fix before building):');
    errors.forEach((e) => console.log(`  - ${e}`));
    console.log('');
  }
  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach((w) => console.log(`  - ${w}`));
    console.log('');
  }

  if (errors.length === 0) {
    console.log('No blocking errors, but review warnings before proceeding.');
  } else {
    console.log('Please fix the errors above before continuing.');
    process.exit(1);
  }
}
