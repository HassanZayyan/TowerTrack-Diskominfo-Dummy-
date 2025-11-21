<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * DRY Service for caching database queries with pagination support
 * Provides reusable patterns for query caching across the application
 */
class QueryCacheService
{
    /**
     * Cache and return a query result
     * 
     * @param string $cacheKey Cache key
     * @param callable $queryCallback Query builder callback
     * @param int|null $ttl Cache TTL in seconds (default: 1 hour)
     * @return mixed Query result
     */
    public static function remember(string $cacheKey, callable $queryCallback, ?int $ttl = null): mixed
    {
        $ttl = $ttl ?? CacheService::DEFAULT_TTL;
        return CacheService::remember($cacheKey, $queryCallback, $ttl);
    }

    /**
     * Cache a paginated query result
     * 
     * @param string $baseKey Base cache key (without page/per_page)
     * @param callable $queryCallback Query builder callback that returns Builder
     * @param int $page Page number
     * @param int $perPage Items per page
     * @param int|null $ttl Cache TTL in seconds
     * @return LengthAwarePaginator
     */
    public static function rememberPaginated(
        string $baseKey,
        callable $queryCallback,
        int $page = 1,
        int $perPage = 15,
        ?int $ttl = null
    ): LengthAwarePaginator {
        $cacheKey = CacheService::paginatedKey($baseKey, [], $page, $perPage);
        
        return self::remember($cacheKey, function () use ($queryCallback, $page, $perPage) {
            $query = $queryCallback();
            
            if (!$query instanceof Builder) {
                throw new \InvalidArgumentException('Query callback must return a Builder instance');
            }
            
            return $query->paginate($perPage, ['*'], 'page', $page);
        }, $ttl);
    }

    /**
     * Cache a collection query result
     * 
     * @param string $cacheKey Cache key
     * @param callable $queryCallback Query builder callback
     * @param int|null $ttl Cache TTL in seconds
     * @return Collection
     */
    public static function rememberCollection(
        string $cacheKey,
        callable $queryCallback,
        ?int $ttl = null
    ): Collection {
        return self::remember($cacheKey, function () use ($queryCallback) {
            $query = $queryCallback();
            
            if (!$query instanceof Builder) {
                throw new \InvalidArgumentException('Query callback must return a Builder instance');
            }
            
            return $query->get();
        }, $ttl);
    }

    /**
     * Cache a single model query result
     * 
     * @param string $cacheKey Cache key
     * @param callable $queryCallback Query builder callback
     * @param int|null $ttl Cache TTL in seconds
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public static function rememberModel(
        string $cacheKey,
        callable $queryCallback,
        ?int $ttl = null
    ): ?\Illuminate\Database\Eloquent\Model {
        return self::remember($cacheKey, function () use ($queryCallback) {
            $query = $queryCallback();
            
            if (!$query instanceof Builder) {
                throw new \InvalidArgumentException('Query callback must return a Builder instance');
            }
            
            return $query->first();
        }, $ttl);
    }

    /**
     * Invalidate cache for a model type
     * 
     * @param string $modelName Model name (e.g., 'towers', 'reports')
     * @return void
     */
    public static function invalidateModelCache(string $modelName): void
    {
        CacheService::invalidateByPattern("{$modelName}:*");
    }
}


