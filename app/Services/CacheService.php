<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Service class for handling API response caching
 * Helps improve performance by reducing database queries
 */
class CacheService
{
    /**
     * Default cache duration in seconds (1 hour)
     */
    const DEFAULT_TTL = 3600;

    /**
     * Cache a value with a key
     * 
     * @param string $key Cache key
     * @param mixed $value Value to cache
     * @param int|null $ttl Time to live in seconds (default: 1 hour)
     * @return mixed The cached value
     */
    public static function put(string $key, $value, ?int $ttl = null)
    {
        $ttl = $ttl ?? self::DEFAULT_TTL;
        Cache::put($key, $value, $ttl);
        return $value;
    }

    /**
     * Get a cached value or execute callback and cache the result
     * 
     * @param string $key Cache key
     * @param callable $callback Function to execute if cache misses
     * @param int|null $ttl Time to live in seconds (default: 1 hour)
     * @return mixed The cached or newly computed value
     */
    public static function remember(string $key, callable $callback, ?int $ttl = null)
    {
        $ttl = $ttl ?? self::DEFAULT_TTL;
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Get a cached value
     * 
     * @param string $key Cache key
     * @param mixed $default Default value if key doesn't exist
     * @return mixed The cached value or default
     */
    public static function get(string $key, $default = null)
    {
        return Cache::get($key, $default);
    }

    /**
     * Check if a key exists in cache
     * 
     * @param string $key Cache key
     * @return bool True if exists, false otherwise
     */
    public static function has(string $key): bool
    {
        return Cache::has($key);
    }

    /**
     * Remove a cached value
     * 
     * @param string $key Cache key
     * @return bool True if removed, false otherwise
     */
    public static function forget(string $key): bool
    {
        return Cache::forget($key);
    }

    /**
     * Clear all cache
     * 
     * @return bool True if successful, false otherwise
     */
    public static function flush(): bool
    {
        return Cache::flush();
    }

    /**
     * Generate a cache key for tower list
     * 
     * @param array $filters Optional filters to include in key
     * @return string Cache key
     */
    public static function towerListKey(array $filters = []): string
    {
        if (empty($filters)) {
            return 'towers:list:all';
        }
        return 'towers:list:' . md5(json_encode($filters));
    }

    /**
     * Generate a cache key for a specific tower
     * 
     * @param int $towerId Tower ID
     * @return string Cache key
     */
    public static function towerKey(int $towerId): string
    {
        return "tower:{$towerId}";
    }

    /**
     * Generate a cache key for report list
     * 
     * @param array $filters Optional filters to include in key
     * @return string Cache key
     */
    public static function reportListKey(array $filters = []): string
    {
        if (empty($filters)) {
            return 'reports:list:all';
        }
        return 'reports:list:' . md5(json_encode($filters));
    }

    /**
     * Generate a cache key for a specific report
     * 
     * @param int $reportId Report ID
     * @return string Cache key
     */
    public static function reportKey(int $reportId): string
    {
        return "report:{$reportId}";
    }

    /**
     * Generate a cache key for FO routes
     * 
     * @return string Cache key
     */
    public static function foRoutesKey(): string
    {
        return 'fo:routes:all';
    }

    /**
     * Invalidate all tower-related caches
     * Useful when towers are created, updated, or deleted
     * 
     * @return void
     */
    public static function invalidateTowerCaches(): void
    {
        $pattern = 'towers:*';
        // Note: This requires Redis or a cache driver that supports patterns
        // For file cache, you may need to track keys manually
        Cache::flush(); // Use this as fallback or implement pattern matching
    }

    /**
     * Invalidate all report-related caches
     * Useful when reports are created, updated, or deleted
     * 
     * @return void
     */
    public static function invalidateReportCaches(): void
    {
        $pattern = 'reports:*';
        Cache::flush(); // Use this as fallback or implement pattern matching
    }

    /**
     * Generate cache key from model and filters (DRY helper)
     * 
     * @param string $modelName Model name (e.g., 'towers', 'reports')
     * @param array $filters Filters to include in key
     * @param string|null $suffix Optional suffix (e.g., 'list', 'detail')
     * @return string Cache key
     */
    public static function key(string $modelName, array $filters = [], ?string $suffix = null): string
    {
        $parts = [$modelName];
        
        if ($suffix) {
            $parts[] = $suffix;
        }
        
        if (!empty($filters)) {
            // Sort filters to ensure consistent keys
            ksort($filters);
            $parts[] = md5(json_encode($filters));
        } else {
            $parts[] = 'all';
        }
        
        return implode(':', $parts);
    }

    /**
     * Generate cache key for paginated results
     * 
     * @param string $modelName Model name
     * @param array $filters Filters
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return string Cache key
     */
    public static function paginatedKey(string $modelName, array $filters = [], int $page = 1, int $perPage = 15): string
    {
        return self::key($modelName, array_merge($filters, ['page' => $page, 'per_page' => $perPage]), 'paginated');
    }

    /**
     * Invalidate cache by pattern (works with Redis, falls back to flush for others)
     * 
     * @param string $pattern Pattern to match (e.g., 'towers:*', 'reports:list:*')
     * @return void
     */
    public static function invalidateByPattern(string $pattern): void
    {
        $driver = config('cache.default');
        
        if ($driver === 'redis') {
            try {
                $store = Cache::getStore();
                if (method_exists($store, 'getRedis')) {
                    $redis = $store->getRedis();
                    $prefix = config('cache.prefix', '');
                    $fullPattern = $prefix . $pattern;
                    $keys = $redis->keys($fullPattern);
                    if (!empty($keys)) {
                        $redis->del($keys);
                    }
                    return;
                }
            } catch (\Exception $e) {
                \Log::warning('Cache pattern invalidation failed, falling back to flush', [
                    'pattern' => $pattern,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        // For non-Redis drivers or if Redis pattern matching fails, flush all
        // Note: This is less precise but ensures cache is cleared
        Cache::flush();
    }

    /**
     * Cache key for FO points
     * 
     * @param string $area Area name
     * @param string|null $provider Provider filter
     * @param string|null $side Side of road filter
     * @param string|null $status Status filter
     * @return string Cache key
     */
    public static function foPointsKey(string $area, ?string $provider = null, ?string $side = null, ?string $status = null): string
    {
        return self::key('fo_points', array_filter([
            'area' => $area,
            'provider' => $provider,
            'side' => $side,
            'status' => $status !== 'all' ? $status : null,
        ]));
    }

    /**
     * Cache key for my messages
     * 
     * @param bool $isAuthenticated Whether user is authenticated
     * @param array $filters Additional filters
     * @return string Cache key
     */
    public static function myMessagesKey(bool $isAuthenticated, array $filters = []): string
    {
        return self::key('my_messages', array_merge([
            'auth' => $isAuthenticated ? 'yes' : 'no',
        ], $filters));
    }
}

