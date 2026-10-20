FROM php:8.2-apache

# Installer les dépendances système et les extensions PHP nécessaires.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
    libssl-dev \
    pkg-config \
    && docker-php-ext-install \
        pdo_mysql \
        intl \
        opcache \
        zip \
    && pecl install mongodb-1.21.5 \
    && docker-php-ext-enable mongodb \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Installer Composer.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configurer Apache pour servir le dossier public de Symfony.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri \
    -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/*.conf \
    /etc/apache2/apache2.conf \
    /etc/apache2/conf-available/*.conf \
    && printf '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n\
\n\
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1\n' \
    > /etc/apache2/conf-available/symfony.conf \
    && a2enconf symfony

WORKDIR /var/www/html

# Installer les dépendances PHP à partir des fichiers Composer.
COPY composer.json composer.lock ./

RUN composer install \
    --no-interaction \
    --prefer-dist \
    --no-progress \
    --no-scripts

# Copier le projet Symfony.
COPY . .

# Préparer les répertoires nécessaires à Symfony.
RUN mkdir -p var/cache var/log \
    && chown -R www-data:www-data var \
    && composer dump-autoload --optimize --no-scripts

EXPOSE 80

CMD ["apache2-foreground"]