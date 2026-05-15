#!/bin/sh
set -eu

upsert_env_var() {
  key="$1"
  value="$2"

  if [ -z "$value" ]; then
    return 0
  fi

  # Dotenv requires quoted values when they contain spaces.
  case "$value" in
    *[[:space:]]*)
      value="\"$value\""
      ;;
  esac

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
upsert_env_var "APP_KEY" "${APP_KEY:-}" #this is questionable sicne we have already app key in the live environment. Updating and inserting means backend will no longer decrypt anything that was encrypted with the old key. Our data will be affected
upsert_env_var "JWT_SECRET" "${JWT_SECRET:-}"
upsert_env_var "CACHE_DRIVER" "${CACHE_DRIVER:-file}" # QUESTIONABLE
upsert_env_var "CACHE_STORE" "${CACHE_STORE:-file}"
upsert_env_var "SESSION_DRIVER" "${SESSION_DRIVER:-file}" # Still questionable because we dont know what will be the behavior if this line is changed in the live environment
upsert_env_var "QUEUE_CONNECTION" "${QUEUE_CONNECTION:-sync}" # I think this is uncessery since we have already it in the live environment 
upsert_env_var "REDIS_CLIENT" "${REDIS_CLIENT:-predis}"
upsert_env_var "REDIS_HOST" "${REDIS_HOST:-127.0.0.1}"
upsert_env_var "REDIS_PORT" "${REDIS_PORT:-6379}"
upsert_env_var "REDIS_PASSWORD" "${REDIS_PASSWORD:-}"
upsert_env_var "FRONTEND_URL" "${FRONTEND_URL:-}"
upsert_env_var "GOOGLE_CLIENT_ID" "${GOOGLE_CLIENT_ID:-}"
upsert_env_var "GOOGLE_CLIENT_SECRET" "${GOOGLE_CLIENT_SECRET:-}"
upsert_env_var "GOOGLE_REDIRECT_URI" "${GOOGLE_REDIRECT_URI:-}"
upsert_env_var "FACEBOOK_CLIENT_ID" "${FACEBOOK_CLIENT_ID:-}"
upsert_env_var "FACEBOOK_CLIENT_SECRET" "${FACEBOOK_CLIENT_SECRET:-}"
upsert_env_var "FACEBOOK_REDIRECT_URI" "${FACEBOOK_REDIRECT_URI:-}"

upsert_env_var "MAIL_MAILER" "${MAIL_MAILER:-}"
upsert_env_var "MAIL_HOST" "${MAIL_HOST:-}"
upsert_env_var "MAIL_PORT" "${MAIL_PORT:-}"
upsert_env_var "MAIL_USERNAME" "${MAIL_USERNAME:-}"
upsert_env_var "MAIL_PASSWORD" "${MAIL_PASSWORD:-}"
upsert_env_var "MAIL_SCHEME" "${MAIL_SCHEME:-}"
upsert_env_var "MAIL_ENCRYPTION" "${MAIL_ENCRYPTION:-}"
upsert_env_var "MAIL_FROM_ADDRESS" "${MAIL_FROM_ADDRESS:-}"
upsert_env_var "MAIL_FROM_NAME" "${MAIL_FROM_NAME:-}"
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
if [ "${REDIS_HOST:-}" != "127.0.0.1" ] && [ -n "${REDIS_HOST:-}" ]; then
  echo "Waiting for Redis ($REDIS_HOST) to be ready..."
  # Try to resolve and ping redis a few times
  for i in $(seq 1 10); do
    if getent hosts "$REDIS_HOST" > /dev/null; then
       echo "Redis is reachable."
       break
    fi
    echo "Waiting for DNS resolution of $REDIS_HOST..."
    sleep 2
  done
fi

php artisan migrate #added this line to ensure database migrations are run before clearing caches
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Skip config:cache here to allow runtime .env changes
# php artisan config:cache 
php artisan storage:link || true
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache #this is redundant, we already have it in the backend dockerfile executed
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache #this is redundant, we already have it in the backend dockerfile executed
exec "$@"
