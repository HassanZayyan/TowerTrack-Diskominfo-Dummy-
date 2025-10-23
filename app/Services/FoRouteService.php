<?php

namespace App\Services;

use App\Models\FoRoute;
use App\Models\FoPoint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Service for handling FO Route operations with caching and error handling
 */
class FoRouteService
{
    /**
     * Cache duration in seconds (1 hour)
     */
    const CACHE_TTL = 3600;

    /**
     * Get active routes by area with caching
     */
    public static function getActiveRoutesByArea(string $area = 'ungaran')
    {
        $cacheKey = "fo_routes:active:{$area}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($area) {
            try {
                return FoRoute::select([
                    'id', 'name', 'color', 'total_distance', 'actual_distance', 
                    'total_points', 'description', 'area', 'status', 'routing_service'
                ])
                ->where('area', $area)
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
            } catch (\Exception $e) {
                Log::error('Failed to fetch FO routes', [
                    'area' => $area,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return collect();
            }
        });
    }

    /**
     * Get route by ID with caching
     */
    public static function getRouteById(int $routeId)
    {
        $cacheKey = "fo_route:{$routeId}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($routeId) {
            try {
                return FoRoute::with(['points'])
                    ->where('id', $routeId)
                    ->where('status', 'active')
                    ->first();
            } catch (\Exception $e) {
                Log::error('Failed to fetch FO route by ID', [
                    'route_id' => $routeId,
                    'error' => $e->getMessage()
                ]);
                
                return null;
            }
        });
    }

    /**
     * Get route GeoJSON with caching
     */
    public static function getRouteGeoJSON(int $routeId)
    {
        $cacheKey = "fo_route:geojson:{$routeId}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($routeId) {
            try {
                $route = FoRoute::find($routeId);
                
                if (!$route) {
                    return null;
                }

                // Check if route has valid GeoJSON
                if ($route->hasValidGeoJSON()) {
                    return $route->geojson;
                }

                // Generate GeoJSON from path coordinates if not available
                if (!empty($route->path_coordinates)) {
                    return self::generateGeoJSONFromPath($route->path_coordinates);
                }

                return null;
            } catch (\Exception $e) {
                Log::error('Failed to fetch FO route GeoJSON', [
                    'route_id' => $routeId,
                    'error' => $e->getMessage()
                ]);
                
                return null;
            }
        });
    }

    /**
     * Generate GeoJSON from path coordinates
     */
    private static function generateGeoJSONFromPath(array $pathCoordinates): array
    {
        if (empty($pathCoordinates) || count($pathCoordinates) < 2) {
            return [];
        }

        // Convert path coordinates to GeoJSON LineString format
        $coordinates = array_map(function ($point) {
            return [
                $point['lng'] ?? $point['longitude'] ?? 0,
                $point['lat'] ?? $point['latitude'] ?? 0
            ];
        }, $pathCoordinates);

        return [
            'type' => 'LineString',
            'coordinates' => $coordinates,
            'properties' => [
                'name' => 'FO Route',
                'type' => 'fiber_optic'
            ]
        ];
    }

    /**
     * Get route statistics
     */
    public static function getRouteStatistics(string $area = 'ungaran')
    {
        $cacheKey = "fo_routes:stats:{$area}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($area) {
            try {
                $routes = FoRoute::where('area', $area)->where('status', 'active');
                
                return [
                    'total_routes' => $routes->count(),
                    'total_distance' => $routes->sum('total_distance'),
                    'total_points' => $routes->sum('total_points'),
                    'average_distance' => $routes->avg('total_distance'),
                    'routes_with_geojson' => $routes->whereNotNull('geojson')->count(),
                ];
            } catch (\Exception $e) {
                Log::error('Failed to fetch FO route statistics', [
                    'area' => $area,
                    'error' => $e->getMessage()
                ]);
                
                return [
                    'total_routes' => 0,
                    'total_distance' => 0,
                    'total_points' => 0,
                    'average_distance' => 0,
                    'routes_with_geojson' => 0,
                ];
            }
        });
    }

    /**
     * Update route with validation
     */
    public static function updateRoute(int $routeId, array $data)
    {
        try {
            $route = FoRoute::findOrFail($routeId);
            
            // Validate data
            $validatedData = self::validateRouteData($data);
            
            $route->update($validatedData);
            
            // Clear cache
            self::clearRouteCache($routeId);
            
            Log::info('FO Route updated successfully', [
                'route_id' => $routeId,
                'updated_fields' => array_keys($validatedData)
            ]);
            
            return $route;
        } catch (\Exception $e) {
            Log::error('Failed to update FO route', [
                'route_id' => $routeId,
                'data' => $data,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Validate route data
     */
    private static function validateRouteData(array $data): array
    {
        $validated = [];
        
        if (isset($data['name'])) {
            $validated['name'] = trim($data['name']);
        }
        
        if (isset($data['description'])) {
            $validated['description'] = trim($data['description']);
        }
        
        if (isset($data['color']) && preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'])) {
            $validated['color'] = $data['color'];
        }
        
        if (isset($data['status']) && in_array($data['status'], ['active', 'inactive', 'maintenance'])) {
            $validated['status'] = $data['status'];
        }
        
        if (isset($data['area']) && in_array($data['area'], ['ungaran', 'ambarawa'])) {
            $validated['area'] = $data['area'];
        }
        
        return $validated;
    }

    /**
     * Clear route-related caches
     */
    public static function clearRouteCache(?int $routeId = null)
    {
        if ($routeId) {
            Cache::forget("fo_route:{$routeId}");
            Cache::forget("fo_route:geojson:{$routeId}");
        }
        
        // Clear area-based caches
        Cache::forget("fo_routes:active:ungaran");
        Cache::forget("fo_routes:active:ambarawa");
        Cache::forget("fo_routes:stats:ungaran");
        Cache::forget("fo_routes:stats:ambarawa");
    }

    /**
     * Get routes for map display with optimized data
     */
    public static function getRoutesForMap(string $area = 'ungaran')
    {
        $cacheKey = "fo_routes:map:{$area}";
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($area) {
            try {
                return FoRoute::select([
                    'id', 'name', 'color', 'path_coordinates', 'geojson', 
                    'total_distance', 'total_points'
                ])
                ->where('area', $area)
                ->where('status', 'active')
                ->get()
                ->map(function ($route) {
                    return [
                        'id' => $route->id,
                        'name' => $route->name,
                        'color' => $route->color,
                        'distance' => $route->total_distance,
                        'points' => $route->total_points,
                        'coordinates' => $route->path_coordinates,
                        'geojson' => $route->geojson,
                        'hasGeoJSON' => $route->hasValidGeoJSON()
                    ];
                });
            } catch (\Exception $e) {
                Log::error('Failed to fetch FO routes for map', [
                    'area' => $area,
                    'error' => $e->getMessage()
                ]);
                
                return collect();
            }
        });
    }
}
