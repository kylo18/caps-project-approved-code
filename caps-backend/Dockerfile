# Use an official PHP image with Apache (Debian-based OS)
FROM php:8.2-apache

# Install required extensions
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache rewrite module (Laravel requires this)
RUN a2enmod rewrite

# Set Apache's DocumentRoot to Laravel's "public" directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

# Update Apache config to point to new DocumentRoot
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf

# Set working directory
WORKDIR /var/www/html

# Copy Laravel project files into the container (make sure this is done before installing Composer dependencies)
COPY . .

# Install Composer
RUN apt-get update && apt-get install -y unzip curl \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Laravel dependencies and will create a vendor file 
RUN composer install --no-dev --optimize-autoloader

# Set file permissions (very important for Laravel)
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Expose port 80
EXPOSE 80

# Start Apache and run artisan storage:link
CMD php artisan storage:link && apache2-foreground
