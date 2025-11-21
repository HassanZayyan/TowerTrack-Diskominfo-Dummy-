<?php

namespace App\Http\Controllers;

use App\Services\CacheService;
use App\Services\QueryCacheService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Base Controller with DRY helpers for caching, pagination, and common patterns
 * Extend this controller to get reusable optimization methods
 */
abstract class BaseController extends Controller
{
    /**
     * Get pagination parameters from request with defaults
     * 
     * @param Request $request
     * @param int $defaultPerPage Default items per page
     * @return array ['page' => int, 'per_page' => int]
     */
    protected function getPaginationParams(Request $request, int $defaultPerPage = 15): array
    {
        return [
            'page' => max(1, (int) $request->get('page', 1)),
            'per_page' => max(1, min(100, (int) $request->get('per_page', $defaultPerPage))),
        ];
    }

    /**
     * Cache and paginate a query with automatic cache key generation
     * 
     * @param string $modelName Model name for cache key
     * @param callable $queryCallback Query builder callback
     * @param Request $request Request instance for pagination params
     * @param array $filters Filters for cache key
     * @param int|null $ttl Cache TTL in seconds
     * @return LengthAwarePaginator
     */
    protected function cachedPaginate(
        string $modelName,
        callable $queryCallback,
        Request $request,
        array $filters = [],
        ?int $ttl = null
    ): LengthAwarePaginator {
        $pagination = $this->getPaginationParams($request);
        $baseKey = CacheService::key($modelName, $filters, 'paginated');
        
        return QueryCacheService::rememberPaginated(
            $baseKey,
            $queryCallback,
            $pagination['page'],
            $pagination['per_page'],
            $ttl
        );
    }

    /**
     * Cache a collection query with automatic cache key generation
     * 
     * @param string $modelName Model name for cache key
     * @param callable $queryCallback Query builder callback
     * @param array $filters Filters for cache key
     * @param int|null $ttl Cache TTL in seconds
     * @return Collection
     */
    protected function cachedCollection(
        string $modelName,
        callable $queryCallback,
        array $filters = [],
        ?int $ttl = null
    ): Collection {
        $cacheKey = CacheService::key($modelName, $filters);
        
        return QueryCacheService::rememberCollection($cacheKey, $queryCallback, $ttl);
    }

    /**
     * Cache a single model query
     * 
     * @param string $modelName Model name for cache key
     * @param callable $queryCallback Query builder callback
     * @param array $filters Filters for cache key
     * @param int|null $ttl Cache TTL in seconds
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    protected function cachedModel(
        string $modelName,
        callable $queryCallback,
        array $filters = [],
        ?int $ttl = null
    ): ?\Illuminate\Database\Eloquent\Model {
        $cacheKey = CacheService::key($modelName, $filters, 'detail');
        
        return QueryCacheService::rememberModel($cacheKey, $queryCallback, $ttl);
    }

    /**
     * Invalidate cache for a model type
     * 
     * @param string $modelName Model name
     * @return void
     */
    protected function invalidateModelCache(string $modelName): void
    {
        QueryCacheService::invalidateModelCache($modelName);
    }
}


