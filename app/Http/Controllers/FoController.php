<?php

namespace App\Http\Controllers;

use App\Models\FoPoint;
use App\Models\FoProvider;
use App\Models\FoRoute;
use App\Services\CacheService;
use App\Traits\HasFoPointValidation;
use App\Traits\HasFoRouteStatistics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FoController extends Controller
{
    use HasFoPointValidation, HasFoRouteStatistics;
    // Constants untuk validasi
    private const VALID_SIDE_OF_ROAD = ['left', 'right', 'unknown'];

    /**
     * Apply provider filter to points query
     */
    private function applyProviderFilterToPoints($query, ?string $provider): void
    {
        if (!$provider || $provider === 'all') {
            return;
        }

        $query->whereExists(function ($subQuery) use ($provider) {
            $subQuery->select(DB::raw(1))
                    ->from('fo_point_provider')
                    ->join('fo_providers', 'fo_point_provider.fo_provider_id', '=', 'fo_providers.id')
                    ->whereColumn('fo_point_provider.fo_point_id', 'fo_points.id')
                    ->where('fo_point_provider.is_active', true);

                // Check if provider is numeric (ID) or string (name)
                if (is_numeric($provider)) {
                $subQuery->where('fo_providers.id', $provider);
                } else {
                $subQuery->where('fo_providers.name', $provider);
                }
            });
        }

    /**
     * Apply side of road filter to points query
     */
    private function applySideOfRoadFilterToPoints($query, ?string $side): void
    {
        if ($this->isValidSideOfRoad($side)) {
            $query->where('side_of_road', $side);
        }
    }

    /**
     * Apply all filters to points query (provider and side)
     */
    private function applyFiltersToPoints($pointsQuery, ?string $provider, ?string $side): void
    {
        $this->applyProviderFilterToPoints($pointsQuery, $provider);
        $this->applySideOfRoadFilterToPoints($pointsQuery, $side);
    }

    /**
     * Apply filters to routes query (provider and/or side)
     */
    private function applyFiltersToRoutes($routesQuery, ?string $provider, ?string $side): void
    {
        if ($provider && $provider !== 'all') {
            $routesQuery->whereHas('points', function ($q) use ($provider, $side) {
                $q->whereColumn('fo_points.area', 'fo_routes.area');
                
                // Apply provider filter
                $this->applyProviderFilterToPoints($q, $provider);
                
                // Apply side filter if provided
                if ($this->isValidSideOfRoad($side)) {
                    $q->where('fo_points.side_of_road', $side);
                }
            });
        } elseif ($this->isValidSideOfRoad($side)) {
            // Only side filter (no provider)
            $routesQuery->whereHas('points', function ($q) use ($side) {
                $q->whereColumn('fo_points.area', 'fo_routes.area')
                  ->where('fo_points.side_of_road', $side);
            });
        } else {
            // No filters - only show routes with providers
            $routesQuery->hasProviders();
        }
    }

    /**
     * Validate side of road value
     */
    private function isValidSideOfRoad(?string $side): bool
    {
        return $side && $side !== 'all' && in_array($side, self::VALID_SIDE_OF_ROAD);
    }

    /**
     * Display the FO data page
     * Optimized: Route polylines excluded from initial load for better performance
     */
    public function index(Request $request)
    {
        $area = $request->get('area', 'ungaran'); // Default ke ungaran
        $provider = $request->get('provider'); // Filter by provider
        $side = $request->get('side'); // Filter by side of road

        // Build query for FO points
        $pointsQuery = FoPoint::where('area', $area)
            ->where('status', 'active');

        // Apply filters using helper methods
        $this->applyFiltersToPoints($pointsQuery, $provider, $side);

        // Cache FO points query
        $cacheKey = CacheService::foPointsKey($area, $provider, $side);
        $foPoints = CacheService::remember($cacheKey, function () use ($pointsQuery) {
            return $pointsQuery
                ->with(['providers' => function ($q) {
                    $q->wherePivot('is_active', true)
                        ->select('fo_providers.id', 'fo_providers.name', 'fo_providers.default_sort_order')
                        ->orderBy('fo_providers.default_sort_order')
                        ->orderBy('fo_providers.name');
                }])
                ->orderBy('route_name')
                ->orderBy('sequence_number')
                ->get()
                ->map(function ($point) {
                    return [
                        'id' => $point->id,
                        'name' => $point->name,
                        'latitude' => (float) $point->latitude,
                        'longitude' => (float) $point->longitude,
                        'type' => $point->type,
                        'route_name' => $point->route_name,
                        'sequence_number' => $point->sequence_number,
                        'description' => $point->description,
                        'side_of_road' => $point->side_of_road ?? 'unknown',
                        'images' => [
                            'isp' => $point->isp_image_url,
                            'pole' => $point->pole_image_url,
                            'junction_box' => $point->junction_box_image_url,
                        ],
                        'has_images' => ! empty($point->isp_image) || ! empty($point->pole_image) || ! empty($point->junction_box_image),
                        'area' => $point->area,
                        'status' => $point->status,
                        'providers' => $point->providers->map(function ($provider) {
                            return [
                                'id' => $provider->id,
                                'name' => $provider->name,
                            ];
                        })->toArray(),
                    ];
                });
        }, 3600); // Cache for 1 hour

        // Build query for FO routes
        $routesQuery = FoRoute::where('area', $area)
            ->where('status', 'active');

        // Apply filters using helper method
        $this->applyFiltersToRoutes($routesQuery, $provider, $side);

        // Cache FO routes query
        $routesCacheKey = CacheService::key('fo_routes', [
            'area' => $area,
            'provider' => $provider,
            'side' => $side,
        ]);
        
        // Get FO routes by area - WITHOUT heavy polyline data for initial load
        // Users can load specific route polylines via dropdown on-demand
        $foRoutes = CacheService::remember($routesCacheKey, function () use ($routesQuery) {
            return $routesQuery
                ->select('id', 'name', 'color', 'total_distance', 'actual_distance', 'total_points', 'description', 'area', 'status', 'routing_service')
                ->get()
                ->map(function ($route) {
                // Get unique providers for this route through its points
                $pointIds = FoPoint::where('route_name', $route->name)
                    ->where('area', $route->area)
                    ->pluck('id')
                    ->toArray();

                // Query master providers through pivot table using whereExists
                $providers = FoProvider::whereExists(function ($query) use ($pointIds) {
                    $query->select(DB::raw(1))
                        ->from('fo_point_provider')
                        ->whereColumn('fo_point_provider.fo_provider_id', 'fo_providers.id')
                        ->whereIn('fo_point_provider.fo_point_id', $pointIds)
                        ->where('fo_point_provider.is_active', true);
                })
                    ->active()
                    ->select('id', 'name', 'default_sort_order')
                    ->orderBy('default_sort_order')
                    ->orderBy('name')
                    ->distinct()
                    ->get()
                    ->map(function ($provider) {
                        return [
                            'id' => $provider->id,
                            'name' => $provider->name,
                        ];
                    })
                    ->values()
                    ->toArray();

                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'color' => $route->color,
                    'total_distance' => is_numeric($route->actual_distance) ? (float) $route->actual_distance :
                                        (is_numeric($route->total_distance) ? (float) $route->total_distance : 0.0),
                    'total_points' => (int) $route->total_points,
                    'description' => $route->description,
                    // Polyline data excluded - load via API when route is selected
                    'area' => $route->area,
                    'status' => $route->status,
                    'routing_service' => $route->routing_service,
                    'has_providers' => ! empty($providers), // Flag untuk frontend
                    'providers' => $providers,
                ];
            });
        }, 3600); // Cache for 1 hour

        // Calculate map bounds
        $bounds = $this->calculateMapBounds($foPoints);

        // Get available master providers for filter dropdown
        $availableProviders = FoProvider::active()
            ->select('id', 'name', 'default_sort_order')
            ->orderBy('default_sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($provider) {
                return [
                    'id' => $provider->id,
                    'name' => $provider->name,
                ];
            })
            ->toArray();

        return Inertia::render('DataFo/Index', [
            'foPoints' => $foPoints,
            'foRoutes' => $foRoutes,
            'currentArea' => $area,
            'availableAreas' => ['ungaran'],
            'availableProviders' => $availableProviders,
            'selectedProvider' => $provider ?? 'all',
            'mapData' => [
                'points' => $foPoints,
                'routes' => $foRoutes, // Now without polylines
                'bounds' => $bounds,
                'area' => $area,
            ],
        ]);
    }

    /**
     * Store a new FO point
     */
    public function storePoint(Request $request)
    {
        // DRY: Use reusable validation rules from trait
        $validated = $request->validate(
            $this->getFoPointValidationRules(includeProviders: false, includeRouteId: false, includeImages: false)
        );

        $foPoint = FoPoint::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Titik FO berhasil ditambahkan',
            'data' => $foPoint,
        ]);
    }

    /**
     * Store a new FO route
     */
    public function storeRoute(Request $request)
    {
        // DRY: Use reusable validation rules from trait
        $validated = $request->validate(
            $this->getFoRouteValidationRules(includePathCoordinates: true)
        );

        $foRoute = FoRoute::create($validated);

        // Calculate and save total distance
        $foRoute->total_distance = $foRoute->calculateDistance();
        $foRoute->save();

        return response()->json([
            'success' => true,
            'message' => 'Jalur FO berhasil ditambahkan',
            'data' => $foRoute,
        ]);
    }

    /**
     * Update FO point
     */
    public function updatePoint(Request $request, FoPoint $foPoint)
    {
        try {
            // DRY: Use reusable validation rules from trait
            $validated = $request->validate(
                $this->getFoPointValidationRules(includeProviders: false, includeRouteId: false, includeImages: false)
            );

            $foPoint->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Titik FO berhasil diperbarui',
                'data' => $foPoint->fresh(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui titik FO: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update FO route
     */
    public function updateRoute(Request $request, FoRoute $foRoute)
    {
        try {
            // DRY: Use reusable validation rules from trait
            $validated = $request->validate(
                $this->getFoRouteValidationRules(includePathCoordinates: false)
            );

            $foRoute->update($validated);

            // DRY: Use reusable route statistics update from trait
            $this->updateFoRouteStatistics($foRoute->id);

            return response()->json([
                'success' => true,
                'message' => 'Jalur FO berhasil diperbarui',
                'data' => $foRoute->fresh(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui jalur FO: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete FO point
     */
    public function deletePoint(FoPoint $foPoint)
    {
        $foPoint->delete();

        return response()->json([
            'success' => true,
            'message' => 'Titik FO berhasil dihapus',
        ]);
    }

    /**
     * Delete FO route
     */
    public function deleteRoute(FoRoute $foRoute)
    {
        $foRoute->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jalur FO berhasil dihapus',
        ]);
    }

    /**
     * Get FO data for Leaflet map display
     */
    public function getMapData(Request $request)
    {
        $area = $request->get('area', 'ungaran');
        $provider = $request->get('provider');
        $side = $request->get('side');

        // Build query for FO points
        $pointsQuery = FoPoint::where('area', $area)
            ->where('status', 'active');

        // Apply filters using helper methods
        $this->applyFiltersToPoints($pointsQuery, $provider, $side);

        // Get FO points by area with image URLs
        $foPoints = $pointsQuery
            ->orderBy('route_name')
            ->orderBy('sequence_number')
            ->get()
            ->map(function ($point) {
                return [
                    'id' => $point->id,
                    'name' => $point->name,
                    'latitude' => (float) $point->latitude,
                    'longitude' => (float) $point->longitude,
                    'type' => $point->type,
                    'route_name' => $point->route_name,
                    'sequence_number' => $point->sequence_number,
                    'description' => $point->description,
                    'side_of_road' => $point->side_of_road ?? 'unknown',
                    'images' => [
                        'isp' => $point->isp_image_url,
                        'pole' => $point->pole_image_url,
                        'junction_box' => $point->junction_box_image_url,
                    ],
                    'has_images' => ! empty($point->isp_image) || ! empty($point->pole_image) || ! empty($point->junction_box_image),
                ];
            });

        // Build query for FO routes
        $routesQuery = FoRoute::where('area', $area)
            ->where('status', 'active');

        // Apply filters using helper method
        $this->applyFiltersToRoutes($routesQuery, $provider, $side);

        // Get FO routes by area with polylines
        $foRoutes = $routesQuery
            ->get()
            ->map(function ($route) {
                // Use GeoJSON coordinates if available, otherwise fallback to path_coordinates
                $polyline = $route->hasValidGeoJSON()
                    ? $route->getGeoJSONCoordinates()
                    : $this->generateRoutePolyline($route->path_coordinates);

                // Get providers for this route
                $providers = $route->providers()->map(function ($provider) {
                    return [
                        'id' => $provider->id,
                        'name' => $provider->name,
                    ];
                })->values()->toArray();

                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'color' => $route->color,
                    'total_distance' => is_numeric($route->actual_distance) ? (float) $route->actual_distance :
                                        (is_numeric($route->total_distance) ? (float) $route->total_distance : 0.0),
                    'total_points' => $route->total_points,
                    'description' => $route->description,
                    'path_coordinates' => $route->path_coordinates,
                    'geojson' => $route->geojson,
                    'has_geojson' => $route->hasValidGeoJSON(),
                    'routing_service' => $route->routing_service,
                    'polyline' => $polyline,
                    'has_providers' => ! empty($providers), // Flag untuk frontend
                    'providers' => $providers,
                ];
            });

        // Calculate map bounds
        $bounds = $this->calculateMapBounds($foPoints);

        return response()->json([
            'success' => true,
            'data' => [
                'points' => $foPoints,
                'routes' => $foRoutes,
                'bounds' => $bounds,
                'area' => $area,
            ],
        ]);
    }

    /**
     * Get details for FO point or route
     * Returns Inertia response for proper CSRF handling
     * Supports both Inertia.js requests (with X-Inertia header) and regular JSON requests
     */
    public function getDetails(Request $request, $type, $id)
    {
        if ($type === 'point') {
            $point = FoPoint::with(['providers' => function ($q) {
                $q->wherePivot('is_active', true)
                    ->select('fo_providers.id', 'fo_providers.name', 'fo_providers.default_sort_order')
                    ->orderBy('fo_providers.default_sort_order')
                    ->orderBy('fo_providers.name');
            }])->findOrFail($id);

            // Get related routes for this point
            $relatedRoutes = $point->routes()->map(function ($route) {
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'color' => $route->color,
                    'total_distance' => (float) $route->total_distance,
                    'total_points' => $route->total_points,
                ];
            });

            $detailData = [
                'success' => true,
                'type' => 'point',
                'data' => [
                    'point' => [
                        'id' => $point->id,
                        'name' => $point->name,
                        'latitude' => (float) $point->latitude,
                        'longitude' => (float) $point->longitude,
                        'type' => $point->type,
                        'route_name' => $point->route_name,
                        'sequence_number' => $point->sequence_number,
                        'description' => $point->description,
                        'area' => $point->area,
                        'status' => $point->status,
                        'images' => [
                            'isp' => $point->isp_image_url,
                            'pole' => $point->pole_image_url,
                            'junction_box' => $point->junction_box_image_url,
                        ],
                        'has_images' => ! empty($point->isp_image) || ! empty($point->pole_image) || ! empty($point->junction_box_image),
                        'providers' => $point->providers->map(function ($provider) {
                            return [
                                'id' => $provider->id,
                                'name' => $provider->name,
                            ];
                        })->toArray(),
                    ],
                    'related_routes' => $relatedRoutes,
                ],
            ];
        } elseif ($type === 'route') {
            $route = FoRoute::findOrFail($id);

            $points = $route->points()
                ->where('fo_points.area', $route->area)
                ->get()
                ->map(function ($point) {
                    return [
                        'id' => $point->id,
                        'name' => $point->name,
                        'latitude' => (float) $point->latitude,
                        'longitude' => (float) $point->longitude,
                        'type' => $point->type,
                        'sequence_number' => $point->sequence_number,
                        'images' => [
                            'isp' => $point->isp_image_url,
                            'pole' => $point->pole_image_url,
                            'junction_box' => $point->junction_box_image_url,
                        ],
                    ];
                });

            $enhancedPolyline = $this->generateEnhancedRoutePolyline($route->path_coordinates);

            $detailData = [
                'success' => true,
                'type' => 'route',
                'data' => [
                    'route' => [
                        'id' => $route->id,
                        'name' => $route->name,
                        'color' => $route->color,
                        'total_distance' => (float) $route->total_distance,
                        'total_points' => $route->total_points,
                        'description' => $route->description,
                        'area' => $route->area,
                        'status' => $route->status,
                    ],
                    'points' => $points,
                    'polyline' => $enhancedPolyline,
                    'bounds' => $this->calculateMapBounds($points),
                ],
            ];
        } else {
            // For Inertia.js requests, return back with error
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['type' => 'Invalid type. Must be "point" or "route"']);
            }

            // For regular JSON requests, return JSON error
            return response()->json([
                'success' => false,
                'message' => 'Invalid type. Must be "point" or "route"',
            ], 400);
        }

        // Check if this is an Inertia.js request
        if ($request->header('X-Inertia')) {
            // FIX: Use Inertia::render() instead of back() to ensure detailData is available
            // When using only: ['detailData'], Inertia needs the prop to exist in the response
            // back() redirects to previous page which doesn't have detailData in its props
            return Inertia::render('DataFo/Index', [
                'detailData' => $detailData,
            ]);
        }

        // Fallback to JSON response for non-Inertia requests (backwards compatibility)
        return response()->json($detailData);
    }

    /**
     * Get route polyline on-demand (for lazy loading with persistent caching)
     *
     * CACHING STRATEGY (Public Page):
     * - NO server-side cache (simpler, let browser cache handle it)
     * - Frontend implements session-based cache (faster UX)
     * - Each route selection generates GeoJSON if not exists
     *
     * TOKEN CONSUMPTION:
     * - First-time selection: 1 token (if no GeoJSON exists)
     * - Same route in same session: 0 tokens (frontend cache)
     * - Same route after page refresh: May consume 0-1 token (depends on DB state)
     *
     * WORKFLOW:
     * 1. User selects route → Check if GeoJSON exists in database
     * 2. Has GeoJSON? → Return from DB (0 tokens)
     * 3. No GeoJSON? → Generate on-demand (1 token)
     * 4. Frontend caches result in session
     * 5. User navigates away and back → Frontend uses session cache (0 tokens)
     */
    public function getRoutePolyline($routeId)
    {
        try {
            $foRoute = FoRoute::findOrFail($routeId);

            // Check if GeoJSON exists in database
            $hasGeoJSON = $foRoute->hasValidGeoJSON();
            $needsGeneration = ! $hasGeoJSON;

            if ($needsGeneration) {
                \Log::info('🔄 PUBLIC - Generating GeoJSON on-demand (1 token will be consumed)', [
                    'route_id' => $foRoute->id,
                    'route_name' => $foRoute->name,
                    'endpoint' => 'public',
                    'user_ip' => request()->ip(),
                ]);

                // Generate GeoJSON on-demand (consumes 1 OpenRouteService token)
                $routeService = app(\App\Services\FoRouteGenerationService::class);
                $generated = $routeService->generateRouteFromPoints($foRoute);

                if (! $generated) {
                    \Log::warning('⚠️ PUBLIC - GeoJSON generation failed, using fallback polyline (0 tokens)', [
                        'route_id' => $foRoute->id,
                    ]);
                }

                // Refresh the route model to get newly generated GeoJSON
                $foRoute = $foRoute->fresh();
            } else {
                \Log::info('✅ PUBLIC - Loading existing GeoJSON from database (0 tokens)', [
                    'route_id' => $foRoute->id,
                    'route_name' => $foRoute->name,
                    'user_ip' => request()->ip(),
                ]);
            }

            // Use GeoJSON coordinates if available, otherwise enhanced polyline
            $polyline = $foRoute->hasValidGeoJSON()
                ? $foRoute->getGeoJSONCoordinates()
                : $this->generateEnhancedRoutePolyline($foRoute->path_coordinates);

            \Log::info('✅ PUBLIC - Route polyline served', [
                'route_id' => $foRoute->id,
                'has_geojson' => $foRoute->hasValidGeoJSON(),
                'was_generated' => $needsGeneration,
                'polyline_points' => count($polyline),
                'tokens_consumed' => $needsGeneration ? 1 : 0,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $foRoute->id,
                    'name' => $foRoute->name,
                    'color' => $foRoute->color,
                    'total_distance' => is_numeric($foRoute->actual_distance) ? (float) $foRoute->actual_distance :
                                        (is_numeric($foRoute->total_distance) ? (float) $foRoute->total_distance : 0.0),
                    'total_points' => (int) $foRoute->total_points,
                    'description' => $foRoute->description,
                    'polyline' => $polyline,
                    'coordinates' => $polyline, // For backwards compatibility
                    'has_geojson' => $foRoute->hasValidGeoJSON(),
                    'routing_service' => $foRoute->routing_service,
                    'area' => $foRoute->area,
                    'status' => $foRoute->status,
                    'was_generated_on_demand' => $needsGeneration,
                ],
                'tokens_consumed' => $needsGeneration ? 1 : 0,
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ PUBLIC - Error fetching route polyline', [
                'route_id' => $routeId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data jalur: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get detailed route data with enhanced polyline
     */
    public function getRouteDetails(FoRoute $foRoute)
    {
        $points = $foRoute->points()
            ->where('fo_points.area', $foRoute->area)
            ->get()
            ->map(function ($point) {
                return [
                    'id' => $point->id,
                    'name' => $point->name,
                    'latitude' => (float) $point->latitude,
                    'longitude' => (float) $point->longitude,
                    'type' => $point->type,
                    'sequence_number' => $point->sequence_number,
                    'images' => [
                        'isp' => $point->isp_image_url,
                        'pole' => $point->pole_image_url,
                        'junction_box' => $point->junction_box_image_url,
                    ],
                ];
            });

        // Use GeoJSON coordinates if available, otherwise enhanced polyline
        $polyline = $foRoute->hasValidGeoJSON()
            ? $foRoute->getGeoJSONCoordinates()
            : $this->generateEnhancedRoutePolyline($foRoute->path_coordinates);

        return response()->json([
            'success' => true,
            'data' => [
                'route' => [
                    'id' => $foRoute->id,
                    'name' => $foRoute->name,
                    'color' => $foRoute->color,
                    'total_distance' => $foRoute->actual_distance ?? $foRoute->total_distance,
                    'total_points' => $foRoute->total_points,
                    'description' => $foRoute->description,
                    'has_geojson' => $foRoute->hasValidGeoJSON(),
                    'routing_service' => $foRoute->routing_service,
                ],
                'points' => $points,
                'polyline' => $polyline,
                'bounds' => $this->calculateMapBounds($points),
            ],
        ]);
    }

    /**
     * Generate GeoJSON route from points
     */
    public function generateGeoJSONRoute(Request $request, FoRoute $foRoute)
    {
        try {
            $validated = $request->validate([
                'routing_profile' => 'nullable|string|in:driving,walking,cycling',
                'avoid_highways' => 'nullable|boolean',
                'avoid_tolls' => 'nullable|boolean',
            ]);

            // Update route with new parameters if provided
            if (! empty($validated)) {
                $foRoute->update($validated);
            }

            $routeService = app(\App\Services\FoRouteGenerationService::class);
            $success = $routeService->generateRouteFromPoints($foRoute);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'GeoJSON route berhasil di-generate',
                    'data' => [
                        'route' => $foRoute->fresh(),
                        'has_geojson' => $foRoute->hasValidGeoJSON(),
                        'polyline' => $foRoute->getGeoJSONCoordinates(),
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal generate GeoJSON route. Periksa log untuk detail.',
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate GeoJSON routes for all routes in area
     * Returns Inertia response for proper CSRF handling
     */
    public function generateAllGeoJSONRoutes(Request $request)
    {
        $validated = $request->validate([
            'area' => 'nullable|string|in:ungaran',
        ]);

        $routeService = app(\App\Services\FoRouteGenerationService::class);
        $results = $routeService->regenerateAllRoutes($validated['area'] ?? null);

        // Return back with results for Inertia.js
        return back()->with([
            'success' => "Berhasil generate {$results['success']} jalur dari {$results['total']} total jalur",
            'generateResult' => [
                'success' => $results['success'],
                'failed' => $results['failed'],
                'total' => $results['total'],
            ],
        ]);
    }

    /**
     * Generate route polyline that follows realistic path (not straight lines)
     */
    private function generateRoutePolyline(array $coordinates): array
    {
        if (count($coordinates) < 2) {
            return [];
        }

        $polyline = [];

        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $start = $coordinates[$i];
            $end = $coordinates[$i + 1];

            // Handle both coordinate formats:
            // 1. Array format [longitude, latitude] from seeder
            // 2. Object format {lat, lng} from model
            if (is_array($start) && isset($start[0]) && isset($start[1])) {
                // Array format: [longitude, latitude]
                $startLat = (float) $start[1];
                $startLng = (float) $start[0];
            } else {
                // Object format: {lat, lng}
                $startLat = (float) ($start['lat'] ?? 0);
                $startLng = (float) ($start['lng'] ?? 0);
            }

            if (is_array($end) && isset($end[0]) && isset($end[1])) {
                // Array format: [longitude, latitude]
                $endLat = (float) $end[1];
                $endLng = (float) $end[0];
            } else {
                // Object format: {lat, lng}
                $endLat = (float) ($end['lat'] ?? 0);
                $endLng = (float) ($end['lng'] ?? 0);
            }

            // Add start point
            $polyline[] = [$startLat, $startLng];

            // Generate intermediate points to create a more realistic path
            $intermediatePoints = $this->generateIntermediatePoints(
                $startLat, $startLng,
                $endLat, $endLng
            );

            // Add intermediate points
            foreach ($intermediatePoints as $point) {
                $polyline[] = [$point['lat'], $point['lng']];
            }
        }

        // Add the last point
        $lastPoint = end($coordinates);
        if (is_array($lastPoint) && isset($lastPoint[0]) && isset($lastPoint[1])) {
            // Array format: [longitude, latitude]
            $polyline[] = [(float) $lastPoint[1], (float) $lastPoint[0]];
        } else {
            // Object format: {lat, lng}
            $polyline[] = [(float) ($lastPoint['lat'] ?? 0), (float) ($lastPoint['lng'] ?? 0)];
        }

        return $polyline;
    }

    /**
     * Generate enhanced polyline with more realistic curves
     */
    private function generateEnhancedRoutePolyline(array $coordinates): array
    {
        if (count($coordinates) < 2) {
            return [];
        }

        $polyline = [];

        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $start = $coordinates[$i];
            $end = $coordinates[$i + 1];

            // Handle both array formats: [lng, lat] or ['lng' => x, 'lat' => y]
            $startLng = is_array($start) ? (isset($start['lng']) ? $start['lng'] : $start[0]) : $start;
            $startLat = is_array($start) ? (isset($start['lat']) ? $start['lat'] : $start[1]) : $start;
            $endLng = is_array($end) ? (isset($end['lng']) ? $end['lng'] : $end[0]) : $end;
            $endLat = is_array($end) ? (isset($end['lat']) ? $end['lat'] : $end[1]) : $end;

            // Calculate distance to determine number of intermediate points
            // DRY: Use method from trait
            $distance = $this->calculateHaversineDistance(
                $startLat, $startLng,
                $endLat, $endLng
            );

            // More points for longer distances
            $numPoints = max(3, min(20, (int) ($distance * 10)));

            // Generate smooth curve between points
            $curvePoints = $this->generateCurvePoints(
                $startLat, $startLng,
                $endLat, $endLng,
                $numPoints
            );

            foreach ($curvePoints as $point) {
                $polyline[] = [$point['lat'], $point['lng']];
            }
        }

        return $polyline;
    }

    /**
     * Generate intermediate points between two coordinates
     */
    private function generateIntermediatePoints($lat1, $lng1, $lat2, $lng2): array
    {
        $points = [];
        // DRY: Use method from trait
        $distance = $this->calculateHaversineDistance($lat1, $lng1, $lat2, $lng2);

        // Generate 2-5 intermediate points based on distance
        $numPoints = max(2, min(5, (int) ($distance * 5)));

        for ($i = 1; $i < $numPoints; $i++) {
            $ratio = $i / $numPoints;

            // Add slight curve variation
            $curveOffset = sin($ratio * M_PI) * 0.0001; // Small curve offset

            $lat = $lat1 + ($lat2 - $lat1) * $ratio + $curveOffset;
            $lng = $lng1 + ($lng2 - $lng1) * $ratio + $curveOffset;

            $points[] = [
                'lat' => $lat,
                'lng' => $lng,
            ];
        }

        return $points;
    }

    /**
     * Generate smooth curve points between two coordinates
     */
    private function generateCurvePoints($lat1, $lng1, $lat2, $lng2, $numPoints): array
    {
        $points = [];

        for ($i = 0; $i < $numPoints; $i++) {
            $ratio = $i / ($numPoints - 1);

            // Create a smooth S-curve using sine function
            $curveFactor = sin($ratio * M_PI) * 0.0002; // Adjust curve intensity

            // Add perpendicular offset for more realistic path
            $perpendicularOffset = cos($ratio * M_PI * 2) * 0.0001;

            $lat = $lat1 + ($lat2 - $lat1) * $ratio + $curveFactor;
            $lng = $lng1 + ($lng2 - $lng1) * $ratio + $perpendicularOffset;

            $points[] = [
                'lat' => $lat,
                'lng' => $lng,
            ];
        }

        return $points;
    }


    /**
     * Calculate map bounds from points
     */
    private function calculateMapBounds($points): array
    {
        if ($points->isEmpty()) {
            return [
                'north' => -7.0,
                'south' => -7.2,
                'east' => 110.5,
                'west' => 110.3,
            ];
        }

        $lats = $points->pluck('latitude')->filter();
        $lngs = $points->pluck('longitude')->filter();

        if ($lats->isEmpty() || $lngs->isEmpty()) {
            return [
                'north' => -7.0,
                'south' => -7.2,
                'east' => 110.5,
                'west' => 110.3,
            ];
        }

        $padding = 0.01; // Add padding around bounds

        return [
            'north' => $lats->max() + $padding,
            'south' => $lats->min() - $padding,
            'east' => $lngs->max() + $padding,
            'west' => $lngs->min() - $padding,
        ];
    }
}
