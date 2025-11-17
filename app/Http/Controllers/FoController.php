<?php

namespace App\Http\Controllers;

use App\Models\FoPoint;
use App\Models\FoProvider;
use App\Models\FoRoute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FoController extends Controller
{
    /**
     * Display the FO data page
     * Optimized: Route polylines excluded from initial load for better performance
     */
    public function index(Request $request)
    {
        $area = $request->get('area', 'ungaran'); // Default ke ungaran
        $provider = $request->get('provider'); // Filter by provider

        // Build query for FO points
        $pointsQuery = FoPoint::where('area', $area)
            ->where('status', 'active');

        // Filter by provider if provided (provider can be ID or name)
        if ($provider && $provider !== 'all') {
            $pointsQuery->whereExists(function ($query) use ($provider) {
                $query->select(DB::raw(1))
                    ->from('fo_point_provider')
                    ->join('fo_providers', 'fo_point_provider.fo_provider_id', '=', 'fo_providers.id')
                    ->whereColumn('fo_point_provider.fo_point_id', 'fo_points.id')
                    ->where('fo_point_provider.is_active', true);

                // Check if provider is numeric (ID) or string (name)
                if (is_numeric($provider)) {
                    $query->where('fo_providers.id', $provider);
                } else {
                    $query->where('fo_providers.name', $provider);
                }
            });
        }

        // Get FO points by area with proper data formatting
        $foPoints = $pointsQuery
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

        // Build query for FO routes
        $routesQuery = FoRoute::where('area', $area)
            ->where('status', 'active');

        // Filter routes by provider if provided
        if ($provider && $provider !== 'all') {
            $routesQuery->whereHas('points', function ($q) use ($provider) {
                // Use whereExists to query pivot table directly
                $q->whereColumn('fo_points.area', 'fo_routes.area')
                    ->whereExists(function ($subQuery) use ($provider) {
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
            });
        } else {
            // Only show routes that have at least one provider if no filter
            $routesQuery->hasProviders();
        }

        // Get FO routes by area - WITHOUT heavy polyline data for initial load
        // Users can load specific route polylines via dropdown on-demand
        $foRoutes = $routesQuery
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'area' => 'required|in:ungaran',
            'description' => 'nullable|string',
            'type' => 'required|string|in:pole,junction,hub,endpoint',
            'status' => 'required|string|in:active,inactive,maintenance',
        ]);

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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran',
            'description' => 'nullable|string',
            'path_coordinates' => 'required|array|min:2',
            'path_coordinates.*.lat' => 'required|numeric|between:-90,90',
            'path_coordinates.*.lng' => 'required|numeric|between:-180,180',
            'color' => 'nullable|string|max:7',
            'status' => 'required|string|in:active,inactive,maintenance',
        ]);

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
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'area' => 'required|in:ungaran',
                'description' => 'nullable|string|max:1000',
                'type' => 'required|string|in:pole,junction,hub,endpoint',
                'status' => 'required|string|in:active,inactive,maintenance',
                'route_name' => 'required|string|max:255',
                'sequence_number' => 'required|integer|min:1',
            ]);

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
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'area' => 'required|in:ungaran',
                'description' => 'nullable|string|max:1000',
                'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'status' => 'required|string|in:active,inactive,maintenance',
            ]);

            $foRoute->update($validated);

            // Recalculate total distance and points if needed
            $points = FoPoint::where('route_name', $foRoute->name)
                ->orderBy('sequence_number')
                ->get();

            if ($points->count() > 1) {
                $totalDistance = 0;
                for ($i = 0; $i < $points->count() - 1; $i++) {
                    $totalDistance += $this->calculateDistance(
                        $points[$i]->latitude,
                        $points[$i]->longitude,
                        $points[$i + 1]->latitude,
                        $points[$i + 1]->longitude
                    );
                }
                $foRoute->update([
                    'total_distance' => $totalDistance,
                    'total_points' => $points->count(),
                ]);
            }

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

        // Get FO points by area with image URLs
        $foPoints = FoPoint::where('area', $area)
            ->where('status', 'active')
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
                    'images' => [
                        'isp' => $point->isp_image_url,
                        'pole' => $point->pole_image_url,
                        'junction_box' => $point->junction_box_image_url,
                    ],
                    'has_images' => ! empty($point->isp_image) || ! empty($point->pole_image) || ! empty($point->junction_box_image),
                ];
            });

        // Get FO routes by area with polylines
        // Only show routes that have at least one provider
        $foRoutes = FoRoute::where('area', $area)
            ->where('status', 'active')
            ->hasProviders() // Only show routes with providers
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
            // Return Inertia response with detailData
            return back()->with('detailData', $detailData);
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
            $distance = $this->calculateDistance(
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
        $distance = $this->calculateDistance($lat1, $lng1, $lat2, $lng2);

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
     * Calculate distance between two coordinates in kilometers
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
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
