FROM php:8.4-apache

WORKDIR /var/www/html

RUN apt-get update \
  && apt-get install --no-install-recommends -y \
	libjpeg62-turbo-dev \
	libpng-dev \
  build-essential \
  curl \
  gifsicle \
  git \
  jpegoptim \
  libfreetype6-dev \
  libjpeg-dev \
  libmagickwand-dev \
  libonig-dev \
  libpq-dev \
  libsqlite3-dev \
  libssl-dev \
  libwebp-dev \
  libxml2-dev \
  libzip-dev \
  locales \
  optipng \
  pngquant \
  unzip \
  zip \
  zlib1g-dev \
  vim \
  cron \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* 

RUN pecl install imagick \
  && docker-php-ext-enable imagick \
  && docker-php-ext-install mbstring gd pdo_pgsql pdo_sqlite xml sockets \
  && docker-php-ext-configure gd --enable-gd --with-freetype --with-jpeg

# Configure PHP for large file uploads (100MB)
RUN echo "upload_max_filesize = 100M" >> /usr/local/etc/php/php.ini \
  && echo "post_max_size = 100M" >> /usr/local/etc/php/php.ini \
  && echo "max_execution_time = 300" >> /usr/local/etc/php/php.ini \
  && echo "max_input_time = 300" >> /usr/local/etc/php/php.ini \
  && echo "log_errors = On" >> /usr/local/etc/php/php.ini

# Create a script to configure PHP based on environment
COPY docker/configure-php.sh /usr/local/bin/configure-php.sh
RUN chmod +x /usr/local/bin/configure-php.sh

# Install Composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
  && php -r "if (file_exists('composer-setup.php')) { echo 'Installer verified'.PHP_EOL; } else { echo 'Installer corrupt'.PHP_EOL; unlink('composer-setup.php'); exit(1); }" \
  && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
  && php -r "unlink('composer-setup.php');"

COPY composer.json composer.json
COPY composer.lock composer.lock
RUN composer install \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --no-dev \
    --prefer-dist

COPY ./src /var/www/html/

# Set up cron job
RUN echo '0 0 * * * . /etc/environment; /usr/local/bin/php /var/www/html/cronjobs/contest.php >> /dev/null 2>&1' > /etc/cron.d/contest-cron \
 && chmod 0644 /etc/cron.d/contest-cron \
 && crontab /etc/cron.d/contest-cron

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/configure-php.sh"]
