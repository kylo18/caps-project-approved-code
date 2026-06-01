#!/bin/bash

# Execute script using bash shell

# Fail on errors, undefined variables, or pipeline failures
set -euo pipefail

# Check if caps_backend container is running
if ! docker ps --filter "name=caps_backend" --filter "status=running" | grep -q "caps_backend"; then
  # Exit if container is not found or not running
  echo "ERROR: caps_backend container is not running."
  echo "Please start the container and try again."
  exit 1
fi

# Start database migration
echo "Running database migration inside caps_backend container..."
if docker exec caps_backend bash -lc 'php artisan migrate'; then
  # Migration successful
  echo "Tables have successfully migrated. Please check your database"
  
  # Start database seeding
  echo "Running database seeding..."
  if docker exec caps_backend bash -lc 'php artisan db:seed'; then
    # Seeding successful
    echo "Database seeding completed successfully."
  else
    # Seeding failed
    echo "ERROR: Database seeding failed."
    exit 1
  fi
else
  # Migration failed
  echo "ERROR: Migration failed."
  exit 1
fi

