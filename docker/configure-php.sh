#!/bin/bash

printenv | grep -v "no_proxy" | awk -F= '{print "export " $1 "=\"" substr($0, index($0,$2)) "\""}' > /etc/environment

# Configure PHP based on environment variables
# Default to development settings if not specified

chmod 777 /var/www/html/users
chmod 777 /var/www/html/avatar/a
chmod 777 /var/www/html/cache/
chmod 777 /var/www/html/config/currentcontest.txt
chmod 777 /var/www/html/database/originalmembers.db
chmod 777 /var/www/html/graphics/gif
chmod 777 /var/www/html/graphics/png
chmod 777 /var/www/html/graphics/prj
chmod 777 /var/www/html/legal
chmod 777 /var/www/html/update/temp
chmod 777 /var/www/html/update/uploads
chmod 777 /var/www/html/update/currentversion.txt
chmod 777 /var/www/html/php/verifyscore.php


if [ "${PHP_ENVIRONMENT:-development}" = "production" ]; then
    echo "Configuring PHP for production environment..."
    echo "display_errors = Off" >> /usr/local/etc/php/php.ini
    echo "display_startup_errors = Off" >> /usr/local/etc/php/php.ini
    echo "error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT" >> /usr/local/etc/php/php.ini
else
    echo "Configuring PHP for development environment..."
    echo "display_errors = On" >> /usr/local/etc/php/php.ini
    echo "display_startup_errors = On" >> /usr/local/etc/php/php.ini
    echo "error_reporting = E_ALL" >> /usr/local/etc/php/php.ini
fi

echo "Starting cron daemon..."
cron

echo "Starting Apache..."
exec apache2-foreground
