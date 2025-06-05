#!/bin/sh
php artisan storage:link || true
exec "$@"
