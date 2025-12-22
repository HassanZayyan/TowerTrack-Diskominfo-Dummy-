# Stage 1: Build frontend assets
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build frontend assets
RUN npm run build

# Stage 2: PHP application
FROM php:8.2-fpm-alpine AS php-base

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    mysql-client \
    libxml2-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    icu-dev

# Install PHP extensions (including all required for Laravel and Excel)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp && \
    docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    fileinfo \
    opcache \
    xml \
    intl

# Configure opcache for production performance
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.interned_strings_buffer=16" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.save_comments=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.fast_shutdown=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.enable_cli=0" >> /usr/local/etc/php/conf.d/opcache.ini

# Configure PHP for production
RUN echo "upload_max_filesize=50M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "memory_limit=512M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "max_execution_time=300" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "max_input_time=300" >> /usr/local/etc/php/conf.d/uploads.ini

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files
COPY composer*.json ./

# Install PHP dependencies (no dev dependencies for production)
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application files
COPY . .

# Copy built assets from frontend-builder
COPY --from=frontend-builder /app/public/build ./public/build

# Complete composer setup
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Install fcgi for healthcheck
RUN apk add --no-cache fcgi

# Create PHP-FPM healthcheck script
RUN echo '#!/bin/sh' > /usr/local/bin/php-fpm-healthcheck && \
    echo 'set -e' >> /usr/local/bin/php-fpm-healthcheck && \
    echo '# Test PHP-FPM socket or TCP connection' >> /usr/local/bin/php-fpm-healthcheck && \
    echo 'if [ -S /var/run/php-fpm.sock ]; then' >> /usr/local/bin/php-fpm-healthcheck && \
    echo '  SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET cgi-fcgi -bind -connect /var/run/php-fpm.sock > /dev/null 2>&1 || exit 1' >> /usr/local/bin/php-fpm-healthcheck && \
    echo 'else' >> /usr/local/bin/php-fpm-healthcheck && \
    echo '  SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET cgi-fcgi -bind -connect 127.0.0.1:9000 > /dev/null 2>&1 || exit 1' >> /usr/local/bin/php-fpm-healthcheck && \
    echo 'fi' >> /usr/local/bin/php-fpm-healthcheck && \
    chmod +x /usr/local/bin/php-fpm-healthcheck

# Expose port
EXPOSE 9000

CMD ["php-fpm"]








