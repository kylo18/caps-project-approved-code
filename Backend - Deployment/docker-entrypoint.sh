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

# Sync runtime secrets and config from Docker env into Laravel's .env file.
upsert_env_var "APP_KEY" "${APP_KEY:-}"
upsert_env_var "JWT_SECRET" "${JWT_SECRET:-}"
upsert_env_var "CACHE_DRIVER" "${CACHE_DRIVER:-file}"
upsert_env_var "SESSION_DRIVER" "${SESSION_DRIVER:-file}" # Still questionable becasue we dont know what will be the behavior if this line is chagned in the live environment
upsert_env_var "QUEUE_CONNECTION" "${QUEUE_CONNECTION:-sync}"
upsert_env_var "REDIS_CLIENT" "${REDIS_CLIENT:-predis}"
upsert_env_var "REDIS_HOST" "${REDIS_HOST:-127.0.0.1}"
upsert_env_var "REDIS_PORT" "${REDIS_PORT:-6379}"
upsert_env_var "FRONTEND_URL" "${FRONTEND_URL:-}"
upsert_env_var "GOOGLE_CLIENT_ID" "${GOOGLE_CLIENT_ID:-}"
upsert_env_var "GOOGLE_CLIENT_SECRET" "${GOOGLE_CLIENT_SECRET:-}"
upsert_env_var "GOOGLE_REDIRECT_URI" "${GOOGLE_REDIRECT_URI:-}"
upsert_env_var "FACEBOOK_CLIENT_ID" "${FACEBOOK_CLIENT_ID:-}"
upsert_env_var "FACEBOOK_CLIENT_SECRET" "${FACEBOOK_CLIENT_SECRET:-}"
upsert_env_var "FACEBOOK_REDIRECT_URI" "${FACEBOOK_REDIRECT_URI:-}"

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

# Clear all caches to ensure fresh settings are loaded
php artisan migrate --force #added this line to ensure database migrations are run before clearing caches
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Skip config:cache here to allow runtime .env changes
# php artisan config:cache 
php artisan storage:link || true
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
exec "$@"
