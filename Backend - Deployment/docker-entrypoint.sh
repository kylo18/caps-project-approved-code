#!/bin/sh
set -eu

upsert_env_var() {
  key="$1"
  value="$2"

  if [ -z "$value" ]; then
    return 0
  fi

  escaped_value=$(printf '%s\n' "$value" | sed 's/[\/&]/\\&/g')

  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s/^${key}=.*/${key}=${escaped_value}/" .env
  else
    printf '\n%s=%s\n' "$key" "$value" >> .env
  fi
}

if [ ! -f .env ]; then
  echo "Setting up configuration files..."
  cp .env.example .env
fi

# Sync runtime secrets from Docker env into Laravel's .env file.
upsert_env_var "APP_KEY" "${APP_KEY:-}"
upsert_env_var "JWT_SECRET" "${JWT_SECRET:-}"

if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
  echo "ERROR: APP_KEY is missing." >&2
  echo "Refusing to generate a new encryption key against a persistent database." >&2
  echo "Set APP_KEY in Backend - Deployment/.env (or pass it via Docker env_file/environment) and restart." >&2
  exit 1
fi

# Skip JWT secret - using Sanctum instead
# if ! grep -q "^JWT_SECRET=." .env 2>/dev/null; then
#   echo "Generating JWT secret..."
#   php artisan jwt:secret --force
# fi

php artisan optimize:clear
php artisan config:cache
php artisan storage:link || true
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
exec "$@"
