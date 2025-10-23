<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Production Environment Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains production-specific configuration settings
    | for the TowerTrack application.
    |
    */

    'app' => [
        'name' => env('APP_NAME', 'TowerTrack'),
        'env' => 'production',
        'debug' => false,
        'url' => env('APP_URL', 'https://your-domain.com'),
        'timezone' => 'Asia/Jakarta',
    ],

    'database' => [
        'connection' => env('DB_CONNECTION', 'mysql'),
        'host' => env('DB_HOST', 'localhost'),
        'port' => env('DB_PORT', '3306'),
        'database' => env('DB_DATABASE', 'towertrack'),
        'username' => env('DB_USERNAME', 'root'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'strict' => true,
        'engine' => 'InnoDB',
    ],

    'cache' => [
        'store' => env('CACHE_STORE', 'redis'),
        'prefix' => env('CACHE_PREFIX', 'towertrack-cache-'),
        'ttl' => 3600, // 1 hour
    ],

    'session' => [
        'driver' => env('SESSION_DRIVER', 'redis'),
        'lifetime' => 120, // 2 hours
        'encrypt' => true,
        'secure' => true,
        'http_only' => true,
        'same_site' => 'strict',
    ],

    'redis' => [
        'host' => env('REDIS_HOST', 'localhost'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_DB', 0),
        'cache_database' => env('REDIS_CACHE_DB', 1),
    ],

    'mail' => [
        'driver' => env('MAIL_MAILER', 'smtp'),
        'host' => env('MAIL_HOST'),
        'port' => env('MAIL_PORT', 587),
        'username' => env('MAIL_USERNAME'),
        'password' => env('MAIL_PASSWORD'),
        'encryption' => env('MAIL_ENCRYPTION', 'tls'),
        'from' => [
            'address' => env('MAIL_FROM_ADDRESS', 'noreply@your-domain.com'),
            'name' => env('MAIL_FROM_NAME', 'TowerTrack'),
        ],
    ],

    'logging' => [
        'channel' => env('LOG_CHANNEL', 'daily'),
        'level' => env('LOG_LEVEL', 'error'),
        'deprecations' => [
            'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
            'trace' => env('LOG_DEPRECATIONS_TRACE', false),
        ],
    ],

    'queue' => [
        'connection' => env('QUEUE_CONNECTION', 'redis'),
        'failed_driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
    ],

    'security' => [
        'force_https' => env('FORCE_HTTPS', true),
        'secure_headers' => env('SECURE_HEADERS', true),
        'rate_limit' => [
            'enabled' => env('RATE_LIMIT_ENABLED', true),
            'requests' => env('RATE_LIMIT_REQUESTS', 60),
            'decay' => env('RATE_LIMIT_DECAY', 60),
        ],
    ],

    'performance' => [
        'octane' => [
            'server' => env('OCTANE_SERVER', 'swoole'),
            'https' => env('OCTANE_HTTPS', true),
            'host' => env('OCTANE_HOST', '127.0.0.1'),
            'port' => env('OCTANE_PORT', 8000),
            'workers' => env('OCTANE_WORKERS', 'auto'),
            'max_requests' => env('OCTANE_MAX_REQUESTS', 500),
        ],
    ],

    'file_upload' => [
        'max_size' => [
            'image' => 10 * 1024 * 1024, // 10MB
            'video' => 100 * 1024 * 1024, // 100MB
        ],
        'allowed_types' => [
            'image' => ['jpeg', 'png', 'jpg'],
            'video' => ['mp4', 'mov', 'avi', 'mkv'],
        ],
        'storage_disk' => env('FILESYSTEM_DISK', 'local'),
    ],
];
