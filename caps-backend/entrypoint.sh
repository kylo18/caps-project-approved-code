#!/bin/sh

# Debug: Check if script is running
echo "Running entrypoint.sh..."

# Move to the Laravel app root
cd /var/www/html

# Ensure proper line endings for .env file (convert Windows line endings to Unix)
echo "Converting .env file to Unix line endings (LF)..."
if [ -f .env ]; then
  sed -i 's/\r//' .env  # Remove Windows line endings if any
else
  echo ".env file does not exist, creating it..."
fi

# Check if the .env file exists, if not, create it from .env.example
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
else
  echo ".env file exists."
fi

# Check if APP_KEY is set or empty in .env file
CURRENT_KEY=$(grep "^APP_KEY=" .env | cut -d '=' -f2-)

if [ -z "$CURRENT_KEY" ]; then
  echo "APP_KEY is not set or empty in .env file. Generating it..."
  GENERATED_KEY=$(php artisan key:generate --show)

  # Remove any unwanted quotes from the generated key
  GENERATED_KEY=$(echo $GENERATED_KEY | sed 's/["]//g')

  if grep -q "^APP_KEY=" .env; then
    sed -i "s|^APP_KEY=.*|APP_KEY=${GENERATED_KEY}|" .env
  else
    echo "APP_KEY=${GENERATED_KEY}" >> .env
  fi
else
  echo "APP_KEY is already set in .env file."
fi

# Set DB environment variables (replace or append)
echo "Setting DB connection environment variables..."

# Function to add or update environment variables in .env
update_or_append_env() {
  VAR=$1
  VALUE=$2
  if grep -qE "^#?\s*${VAR}=" .env; then
    sed -i "s|^#\?\s*${VAR}=.*|${VAR}=${VALUE}|" .env
  else
    echo "${VAR}=${VALUE}" >> .env
  fi
}

# Ensure that DB variables are correctly set in the .env file
update_or_append_env "DB_CONNECTION" "${DB_CONNECTION:-mysql}"
update_or_append_env "DB_HOST" "${DB_HOST:-caps_mysql}"
update_or_append_env "DB_PORT" "${DB_PORT:-3306}"
update_or_append_env "DB_DATABASE" "${DB_DATABASE:-caps_db}"
update_or_append_env "DB_USERNAME" "${DB_USERNAME:-kylo}"
update_or_append_env "DB_PASSWORD" "${DB_PASSWORD:-CAPSwebsite2025}"

# Set APP_URL if passed via environment
if [ ! -z "$APP_URL" ]; then
  if grep -q "^APP_URL=" .env; then
    sed -i "s|^APP_URL=.*|APP_URL=${APP_URL}|" .env
  else
    echo "APP_URL=${APP_URL}" >> .env
  fi
fi

# Run composer install if vendor directory doesn't exist
if [ ! -d vendor ]; then
  echo "Running composer install..."
  composer install --no-dev --optimize-autoloader
else
  echo "Vendor directory exists. Skipping composer install."
fi

# Ensure storage directory is linked
if [ ! -L public/storage ]; then
  echo "Creating storage symlink..."
  php artisan storage:link
else
  echo "Storage symlink already exists. Skipping..."
fi

# Wait for MySQL to be ready with more delay
echo "Waiting for MySQL to be ready..."
until mysql -h${DB_HOST} -u${DB_USERNAME} -p${DB_PASSWORD} ${DB_DATABASE} -e 'select 1;' > /dev/null 2>&1; do
  echo "Waiting for database connection..."
  sleep 10  # Increased wait time to 10 seconds
done

# Run migrations and seeding (non-destructive)
echo "Running php artisan migrate --seed..."
php artisan migrate --seed

# Start Apache in foreground mode
echo "Starting Apache..."
exec apache2-foreground
