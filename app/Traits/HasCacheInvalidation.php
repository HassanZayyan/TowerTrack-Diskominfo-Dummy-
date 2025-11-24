<?php

namespace App\Traits;

use App\Services\CacheService;
use App\Models\FoRoute;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Trait untuk handle cache invalidation yang reusable
 * DRY: Menghilangkan duplikasi logika cache invalidation
 */
trait HasCacheInvalidation
{
    /**
     * Touch route and invalidate its cache
     * DRY: Reusable method untuk touch route dan invalidate cache
     * Best Practice: Touch route SEBELUM invalidate agar cache key berubah
     * 
     * @param int|FoRoute $route Route ID or Route instance
     * @param bool $updateStatistics Whether to update route statistics
     * @return FoRoute|null The touched route instance
     */
    protected function touchRouteAndInvalidateCache($route, bool $updateStatistics = true): ?FoRoute
    {
        try {
            // Get route instance if ID provided
            if (is_int($route)) {
                $route = FoRoute::find($route);
            }

            if (!$route) {
                Log::warning('Cannot touch route - route not found', [
                    'route_id' => is_int($route) ? $route : ($route->id ?? 'unknown'),
                ]);
                return null;
            }

            // Step 1: Touch route to update updated_at (changes cache key)
            // This ensures cache key changes: fo_route_geojson_{id}_{new_timestamp}
            $route->touch();

            // Step 2: Update route statistics if needed
            if ($updateStatistics && method_exists($this, 'updateFoRouteStatistics')) {
                $this->updateFoRouteStatistics($route->id);
            }

            // Step 3: Invalidate cache with new updated_at timestamp
            $this->invalidateRouteCache($route->id);

            Log::info('Route touched and cache invalidated', [
                'route_id' => $route->id,
                'route_name' => $route->name,
                'new_updated_at' => $route->fresh()->updated_at->timestamp,
            ]);

            return $route->fresh();
        } catch (\Exception $e) {
            Log::error('Error touching route and invalidating cache', [
                'route_id' => is_int($route) ? $route : ($route->id ?? 'unknown'),
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Invalidate cache for a specific route's GeoJSON data
     * Called when route or its points are modified
     * 
     * Note: This method should be called AFTER route is touched
     * Use touchRouteAndInvalidateCache() for best practice
     * 
     * @param int $routeId Route ID
     * @return void
     */
    protected function invalidateRouteCache(int $routeId): void
    {
        try {
            $route = FoRoute::find($routeId);
            if (!$route) {
                Log::warning('Cannot invalidate cache - route not found', ['route_id' => $routeId]);
                return;
            }

            // Clear current timestamp key (after touch, this is the new key)
            $currentKey = "fo_route_geojson_{$routeId}_{$route->updated_at->timestamp}";
            Cache::forget($currentKey);

            // Clear old cache keys (last 30 days) for safety
            // This handles edge cases where cache might still exist with old timestamps
            for ($i = 0; $i < 30; $i++) {
                $timestamp = now()->subDays($i)->timestamp;
                $cacheKey = "fo_route_geojson_{$routeId}_{$timestamp}";
                Cache::forget($cacheKey);
            }

            Log::info('Cache invalidated for route', [
                'route_id' => $routeId,
                'route_name' => $route->name,
                'current_timestamp' => $route->updated_at->timestamp,
            ]);
        } catch (\Exception $e) {
            Log::error('Error invalidating route cache', [
                'route_id' => $routeId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate FO points cache for data-fo page
     * This ensures changes to points are reflected immediately
     * 
     * @param string $area Area name
     * @return void
     */
    protected function invalidateFoPointsCache(string $area): void
    {
        try {
            // Invalidate foRoutes cache for this area (CRITICAL: ensures updated_at is fresh)
            // This is important because frontend uses route.updated_at for cache validation
            $this->invalidateFoRoutesCache($area);

            // Invalidate with common filter combinations
            foreach (['all', null] as $provider) {
                foreach (['all', null] as $side) {
                    $key = CacheService::foPointsKey($area, $provider, $side);
                    Cache::forget($key);
                }
            }

            Log::info('FO points cache invalidated', [
                'area' => $area,
            ]);
        } catch (\Exception $e) {
            Log::error('Error invalidating FO points cache', [
                'area' => $area,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate FO routes cache for data-fo page
     * This ensures route updated_at is fresh when points are modified
     * 
     * @param string $area Area name
     * @return void
     */
    protected function invalidateFoRoutesCache(string $area): void
    {
        try {
            // Invalidate foRoutes cache with all possible filter combinations
            // This ensures frontend receives fresh updated_at from database
            foreach (['all', null] as $provider) {
                foreach (['all', null] as $side) {
                    $routesCacheKey = CacheService::key('fo_routes', array_filter([
                        'area' => $area,
                        'provider' => $provider,
                        'side' => $side,
                    ]));
                    Cache::forget($routesCacheKey);
                }
            }

            // Also invalidate base routes cache (no filters)
            $baseRoutesCacheKey = CacheService::key('fo_routes', ['area' => $area]);
            Cache::forget($baseRoutesCacheKey);

            Log::info('FO routes cache invalidated', [
                'area' => $area,
                'note' => 'This ensures frontend receives fresh updated_at for cache validation',
            ]);
        } catch (\Exception $e) {
            Log::error('Error invalidating FO routes cache', [
                'area' => $area,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate cache for multiple routes
     *
     * @param array<int> $routeIds
     * @return void
     */
    protected function invalidateMultipleRoutesCache(array $routeIds): void
    {
        foreach ($routeIds as $routeId) {
            $this->invalidateRouteCache($routeId);
        }
    }
}

