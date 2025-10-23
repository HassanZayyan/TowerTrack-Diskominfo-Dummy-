<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FoPoint;
use App\Models\FoRoute;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FoManagementController extends Controller
{
    /**
     * Display list of FO routes (main entry point)
     * Optimized: path_coordinates excluded to reduce payload size
     */
    public function routesList(Request $request)
    {
        $area = $request->get('area', 'ungaran');

        // Get FO Routes with pagination (excluding heavy path_coordinates field)
        $foRoutes = FoRoute::select([
            'id', 'name', 'area', 'status', 'color', 'total_distance',
            'total_points', 'description', 'created_at', 'updated_at',
        ])
            ->when($area, fn ($q) => $q->where('area', $area))
            ->orderBy('name')
            ->paginate(50)
            ->through(function ($route) {
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'area' => $route->area,
                    'status' => $route->status,
                    'color' => $route->color,
                    'total_distance' => (float) ($route->total_distance ?? 0),
                    'total_points' => (int) ($route->total_points ?? 0),
                    'description' => $route->description,
                    'created_at' => $route->created_at->format('d M Y H:i'),
                    'updated_at' => $route->updated_at->format('d M Y H:i'),
                    // path_coordinates intentionally excluded - fetch on-demand via API
                ];
            });

        // Get comprehensive statistics for routes
        $stats = [
            'total_routes' => FoRoute::when($area, fn ($q) => $q->where('area', $area))->count(),
            'active_routes' => FoRoute::when($area, fn ($q) => $q->where('area', $area))->where('status', 'active')->count(),
            'inactive_routes' => FoRoute::when($area, fn ($q) => $q->where('area', $area))->where('status', 'inactive')->count(),
            'maintenance_routes' => FoRoute::when($area, fn ($q) => $q->where('area', $area))->where('status', 'maintenance')->count(),
            'total_distance' => (float) FoRoute::when($area, fn ($q) => $q->where('area', $area))->sum('total_distance'),
            'total_points' => FoRoute::when($area, fn ($q) => $q->where('area', $area))->sum('total_points'),
            'health_score' => $this->calculateHealthScore($area),
        ];

        return Inertia::render('Admin/FoManagement/RoutesList', [
            'routes' => $foRoutes,
            'stats' => $stats,
            'currentArea' => $area,
            'availableAreas' => ['ungaran'],
        ]);
    }

    /**
     * Fetch GeoJSON data for a specific route (on-demand with persistent caching)
     *
     * CACHING STRATEGY:
     * - Cache duration: 24 hours (persists across page navigation)
     * - Cache key: route_id + updated_at timestamp (auto-invalidates on update)
     * - Cache hit: Returns immediately without API call (0 tokens consumed)
     * - Cache miss + has GeoJSON: Returns existing data (0 tokens consumed)
     * - Cache miss + no GeoJSON: Generates on-demand (1 token consumed)
     *
     * TOKEN CONSUMPTION:
     * - First-time access: 1 token (generates GeoJSON via OpenRouteService)
     * - Subsequent access (within 24h): 0 tokens (uses cache)
     * - After route update: 1 token (cache auto-invalidated, regenerates)
     * - Cross-page navigation: 0 tokens (cache persists in server)
     *
     * WORKFLOW:
     * 1. User clicks route → Check cache
     * 2. Cache hit? → Return immediately (FAST, no token)
     * 3. Cache miss + has DB GeoJSON? → Return from DB (FAST, no token)
     * 4. Cache miss + no GeoJSON? → Generate (SLOW, 1 token)
     * 5. Store in cache for 24 hours
     * 6. Subsequent clicks on same route → Cache hit (INSTANT)
     */
    public function getRouteGeoJson(FoRoute $foRoute)
    {
        try {
            // Step 1: Build cache key (includes updated_at for auto-invalidation)
            $cacheKey = "fo_route_geojson_{$foRoute->id}_{$foRoute->updated_at->timestamp}";

            // Step 2: Check if data is already in cache (fastest path)
            if (Cache::has($cacheKey)) {
                \Log::info('✅ CACHE HIT - Serving from cache (0 tokens)', [
                    'route_id' => $foRoute->id,
                    'route_name' => $foRoute->name,
                    'cache_key' => $cacheKey,
                ]);

                return response()->json([
                    'success' => true,
                    'data' => Cache::get($cacheKey),
                    'generated_on_demand' => false,
                    'from_cache' => true,
                ]);
            }

            // Step 3: Cache miss - check if GeoJSON exists in database
            $hasGeoJSON = $foRoute->hasValidGeoJSON();
            $needsGeneration = ! $hasGeoJSON;

            if ($needsGeneration) {
                \Log::info('🔄 CACHE MISS + NO GEOJSON - Generating on-demand (1 token will be consumed)', [
                    'route_id' => $foRoute->id,
                    'route_name' => $foRoute->name,
                ]);

                // Step 4: Generate GeoJSON on-demand (consumes 1 OpenRouteService token)
                $routeService = app(\App\Services\FoRouteGenerationService::class);
                $generated = $routeService->generateRouteFromPoints($foRoute);

                if (! $generated) {
                    \Log::warning('⚠️ GeoJSON generation failed, using fallback polyline (0 tokens)', [
                        'route_id' => $foRoute->id,
                    ]);
                }

                // Refresh the route model to get newly generated GeoJSON
                $foRoute = $foRoute->fresh();
            } else {
                \Log::info('💾 CACHE MISS + HAS GEOJSON - Loading from database (0 tokens)', [
                    'route_id' => $foRoute->id,
                    'route_name' => $foRoute->name,
                ]);
            }

            // Step 5: Build response data and store in cache for 24 hours
            $geoJsonData = Cache::remember($cacheKey, 86400, function () use ($foRoute, $needsGeneration) {
                // Get all points for this route ordered by sequence
                $points = FoPoint::where('route_name', $foRoute->name)
                    ->where('area', $foRoute->area)
                    ->orderBy('sequence_number')
                    ->get();

                // Build coordinates array from points
                $coordinates = $points->map(function ($point) {
                    return [
                        'lat' => (float) $point->latitude,
                        'lng' => (float) $point->longitude,
                        'name' => $point->name,
                        'type' => $point->type,
                        'status' => $point->status,
                    ];
                })->toArray();

                return [
                    'route_id' => $foRoute->id,
                    'route_name' => $foRoute->name,
                    'area' => $foRoute->area,
                    'status' => $foRoute->status,
                    'color' => $foRoute->color,
                    'total_distance' => (float) ($foRoute->total_distance ?? 0),
                    'coordinates' => $coordinates,
                    'path_coordinates' => $foRoute->path_coordinates ?? [],
                    'has_geojson' => $foRoute->hasValidGeoJSON(),
                    'was_generated_on_demand' => $needsGeneration,
                    'cached_at' => now()->toISOString(),
                ];
            });

            \Log::info('✅ Response cached for 24 hours - Next access will be instant', [
                'route_id' => $foRoute->id,
                'cache_key' => $cacheKey,
                'tokens_consumed' => $needsGeneration ? 1 : 0,
            ]);

            return response()->json([
                'success' => true,
                'data' => $geoJsonData,
                'generated_on_demand' => $needsGeneration,
                'from_cache' => false,
                'tokens_consumed' => $needsGeneration ? 1 : 0,
            ]);

        } catch (\Exception $e) {
            \Log::error('❌ Error fetching route GeoJSON', [
                'route_id' => $foRoute->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data GeoJSON rute: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display detail of a specific FO route with its points
     * Optimized: path_coordinates loaded lazily via separate API call
     */
    public function routeDetail(Request $request, FoRoute $foRoute)
    {
        // Get points in this route with pagination
        $points = FoPoint::where('route_name', $foRoute->name)
            ->where('area', $foRoute->area)
            ->orderBy('sequence_number')
            ->paginate(20)
            ->through(function ($point) {
                return [
                    'id' => $point->id,
                    'name' => $point->name,
                    'latitude' => (float) $point->latitude,
                    'longitude' => (float) $point->longitude,
                    'area' => $point->area,
                    'type' => $point->type,
                    'status' => $point->status,
                    'route_name' => $point->route_name,
                    'sequence_number' => $point->sequence_number,
                    'description' => $point->description,
                    'created_at' => $point->created_at->format('d M Y H:i'),
                    'updated_at' => $point->updated_at->format('d M Y H:i'),
                ];
            });

        // Get route statistics
        $routeStats = [
            'active_points' => FoPoint::where('route_name', $foRoute->name)
                ->where('area', $foRoute->area)
                ->where('status', 'active')
                ->count(),
            'inactive_points' => FoPoint::where('route_name', $foRoute->name)
                ->where('area', $foRoute->area)
                ->where('status', 'inactive')
                ->count(),
            'maintenance_points' => FoPoint::where('route_name', $foRoute->name)
                ->where('area', $foRoute->area)
                ->where('status', 'maintenance')
                ->count(),
            'points_by_type' => FoPoint::where('route_name', $foRoute->name)
                ->where('area', $foRoute->area)
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->get()
                ->map(function ($item) {
                    return [
                        'type' => $item->type,
                        'count' => $item->count,
                        'label' => $this->getTypeLabel($item->type),
                    ];
                }),
        ];

        // Format route data (without path_coordinates - loaded lazily via API)
        $routeData = [
            'id' => $foRoute->id,
            'name' => $foRoute->name,
            'area' => $foRoute->area,
            'status' => $foRoute->status,
            'color' => $foRoute->color,
            'total_distance' => (float) ($foRoute->total_distance ?? 0),
            'total_points' => (int) ($foRoute->total_points ?? 0),
            'description' => $foRoute->description,
            // path_coordinates excluded - frontend will fetch via getRouteGeoJson endpoint
            'created_at' => $foRoute->created_at->format('d M Y H:i'),
            'updated_at' => $foRoute->updated_at->format('d M Y H:i'),
        ];

        return Inertia::render('Admin/FoManagement/RouteDetail', [
            'route' => $routeData,
            'points' => $points,
            'routeStats' => $routeStats,
        ]);
    }

    // The legacy 'index' method has been removed. Overview is deprecated in favor of route-first flow.

    /**
     * Show form to create a new point for a specific route
     */
    public function createPoint(FoRoute $foRoute)
    {
        // Get the next sequence number for this route
        $nextSequence = FoPoint::where('route_name', $foRoute->name)
            ->max('sequence_number') + 1;

        return Inertia::render('Admin/FoManagement/PointCreate', [
            'foRoute' => [
                'id' => $foRoute->id,
                'name' => $foRoute->name,
                'area' => $foRoute->area,
                'status' => $foRoute->status,
                'color' => $foRoute->color,
                'total_distance' => (float) ($foRoute->total_distance ?? 0),
                'total_points' => (int) ($foRoute->total_points ?? 0),
                'description' => $foRoute->description,
            ],
            'availableTypes' => ['pole', 'junction', 'hub', 'endpoint'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
            'nextSequence' => $nextSequence ?: 1,
        ]);
    }

    /**
     * Store a newly created FO point
     */
    public function storePoint(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'area' => 'required|in:ungaran',
            'type' => 'required|in:pole,junction,hub,endpoint',
            'status' => 'required|in:active,inactive,maintenance',
            'route_name' => 'required|string|max:255',
            'route_id' => 'required|exists:fo_routes,id',
            'sequence_number' => 'required|integer|min:1',
            'description' => 'nullable|string|max:1000',
            // Optional Google Drive links for images
            'isp_image' => 'nullable|string|max:2048|url',
            'pole_image' => 'nullable|string|max:2048|url',
            'junction_box_image' => 'nullable|string|max:2048|url',
        ]);

        // Remove route_id from validated data as it's not in the database
        $routeId = $validated['route_id'];
        unset($validated['route_id']);

        $point = FoPoint::create($validated);

        // Update route's total_points and path coordinates
        $this->updateRouteStatistics($routeId);

        // Invalidate cache for this route since points changed
        // GeoJSON will be regenerated on-demand when user next selects this route
        $this->invalidateRouteCache($routeId);

        \Log::info('FO point added successfully - GeoJSON will be regenerated on-demand', [
            'point_id' => $point->id,
            'route_id' => $routeId,
            'area' => $validated['area'],
            'note' => 'GeoJSON generation deferred until user selects this route (saves 1 API token)',
        ]);

        return redirect()
            ->route('admin.fo-management.routes.detail', $routeId)
            ->with('success', 'Titik FO berhasil ditambahkan. Jalur akan diperbarui otomatis saat Anda membuka peta.');
    }

    /**
     * Show the form for editing the specified FO point
     */
    public function editPoint(FoPoint $foPoint, Request $request)
    {
        // Get available routes for dropdown
        $availableRoutes = FoRoute::where('area', $foPoint->area)
            ->select('id', 'name', 'area')
            ->orderBy('name')
            ->get()
            ->map(function ($route) {
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'area' => $route->area,
                ];
            });

        return Inertia::render('Admin/FoManagement/PointEdit', [
            'foPoint' => [
                'id' => $foPoint->id,
                'name' => $foPoint->name,
                'latitude' => (float) $foPoint->latitude,
                'longitude' => (float) $foPoint->longitude,
                'area' => $foPoint->area,
                'type' => $foPoint->type,
                'status' => $foPoint->status,
                'route_name' => $foPoint->route_name,
                'sequence_number' => $foPoint->sequence_number,
                'description' => $foPoint->description,
                'isp_image' => $foPoint->isp_image,
                'pole_image' => $foPoint->pole_image,
                'junction_box_image' => $foPoint->junction_box_image,
            ],
            'availableAreas' => ['ungaran'],
            'availableTypes' => ['pole', 'junction', 'hub', 'endpoint'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
            'availableRoutes' => $availableRoutes,
            'fromRouteDetail' => $request->get('from_route'),
            'parentRouteId' => optional(FoRoute::where('name', $foPoint->route_name)
                ->where('area', $foPoint->area)
                ->first())->id,
        ]);
    }

    /**
     * Update the specified FO point
     */
    public function updatePoint(Request $request, FoPoint $foPoint)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'area' => 'required|in:ungaran',
            'type' => 'required|in:pole,junction,hub,endpoint',
            'status' => 'required|in:active,inactive,maintenance',
            'route_name' => 'required|string|max:255',
            'sequence_number' => 'required|integer|min:1',
            'description' => 'nullable|string|max:1000',
            // Optional Google Drive links for images
            'isp_image' => 'nullable|string|max:2048|url',
            'pole_image' => 'nullable|string|max:2048|url',
            'junction_box_image' => 'nullable|string|max:2048|url',
        ]);

        $oldRouteName = $foPoint->route_name;
        $oldArea = $foPoint->area;

        $foPoint->update($validated);

        // Update route totals for old route if route changed
        if ($oldRouteName !== $validated['route_name'] || $oldArea !== $validated['area']) {
            $oldRoute = FoRoute::where('name', $oldRouteName)->where('area', $oldArea)->first();
            if ($oldRoute) {
                $this->updateRouteStatistics($oldRoute->id);
                $this->invalidateRouteCache($oldRoute->id);
            }
        }

        // Update route totals for new route
        $newRoute = FoRoute::where('name', $validated['route_name'])
            ->where('area', $validated['area'])
            ->first();
        if ($newRoute) {
            $this->updateRouteStatistics($newRoute->id);
            $this->invalidateRouteCache($newRoute->id);

            // Redirect to route detail if we came from there
            if ($request->get('from_route') === 'detail') {
                return redirect()
                    ->route('admin.fo-management.routes.detail', $newRoute->id)
                    ->with('success', 'Titik FO berhasil diperbarui');
            }
        }

        // Default redirect
        return redirect()
            ->route('admin.fo-management.routes.list')
            ->with('success', 'Titik FO berhasil diperbarui');
    }

    /**
     * Remove the specified FO point
     */
    public function destroyPoint(FoPoint $foPoint)
    {
        $routeName = $foPoint->route_name;
        $area = $foPoint->area;

        $foPoint->delete();

        // Update associated route's statistics
        $route = FoRoute::where('name', $routeName)->where('area', $area)->first();
        if ($route) {
            $this->updateRouteStatistics($route->id);
            $this->invalidateRouteCache($route->id);
        }

        return back()->with('success', 'Titik FO berhasil dihapus');
    }

    /**
     * Show the form for creating a new FO route
     */
    public function createRoute()
    {
        return Inertia::render('Admin/FoManagement/RouteCreate', [
            'availableAreas' => ['ungaran'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
        ]);
    }

    /**
     * Store a newly created FO route
     */
    public function storeRoute(Request $request)
    {
        try {
            // Validate incoming data
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'area' => 'required|in:ungaran',
                'description' => 'nullable|string|max:1000',
                'status' => 'required|in:active,inactive,maintenance',
                'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
            ]);

            \Log::info('Creating new FO Route', [
                'validated_data' => $validated,
            ]);

            // Initialize with empty coordinates
            $validated['path_coordinates'] = [];
            $validated['total_points'] = 0;
            $validated['total_distance'] = 0;

            // Create the route
            $route = FoRoute::create($validated);

            \Log::info('FO Route created successfully', [
                'route_id' => $route->id,
                'name' => $route->name,
                'total_distance' => 0,
                'total_points' => 0,
            ]);

            return redirect()
                ->route('admin.fo-management.routes.detail', $route->id)
                ->with('success', 'Jalur FO berhasil dibuat. Silakan tambahkan titik-titik FO untuk membentuk jalur.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for FO Route creation', [
                'errors' => $e->errors(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Error creating FO Route', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal menambahkan jalur FO: '.$e->getMessage());
        }
    }

    /**
     * Show the form for editing the specified FO route
     */
    public function editRoute(FoRoute $foRoute)
    {
        return Inertia::render('Admin/FoManagement/RouteEdit', [
            'foRoute' => [
                'id' => $foRoute->id,
                'name' => $foRoute->name,
                'area' => $foRoute->area,
                'status' => $foRoute->status,
                'color' => $foRoute->color,
                'description' => $foRoute->description,
                'path_coordinates' => $foRoute->path_coordinates,
                'total_distance' => (float) ($foRoute->total_distance ?? 0),
                'total_points' => (int) ($foRoute->total_points ?? 0),
            ],
            'availableAreas' => ['ungaran'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
        ]);
    }

    /**
     * Update the specified FO route
     */
    public function updateRoute(Request $request, FoRoute $foRoute)
    {
        try {
            // Validate incoming data
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'area' => 'required|in:ungaran',
                'description' => 'nullable|string|max:1000',
                'status' => 'required|in:active,inactive,maintenance',
                'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
            ]);

            \Log::info('Updating FO Route', [
                'route_id' => $foRoute->id,
                'validated_data' => $validated,
            ]);

            // Store old route name and area for later comparison
            $oldRouteName = $foRoute->name;
            $oldArea = $foRoute->area;

            // Update the route (without modifying coordinates)
            $foRoute->update($validated);

            // Update total points if route name or area changed
            if ($oldRouteName !== $validated['name'] || $oldArea !== $validated['area']) {
                // Update points associated with old route name
                FoPoint::where('route_name', $oldRouteName)
                    ->where('area', $oldArea)
                    ->update([
                        'route_name' => $validated['name'],
                        'area' => $validated['area'],
                    ]);

                // Update route statistics
                $this->updateRouteStatistics($foRoute->id);
            }

            // Always invalidate cache when route is updated
            $this->invalidateRouteCache($foRoute->id);

            \Log::info('FO Route updated successfully', [
                'route_id' => $foRoute->id,
                'total_distance' => $foRoute->total_distance,
                'total_points' => $foRoute->total_points,
            ]);

            return redirect()
                ->route('admin.fo-management.routes.detail', $foRoute->id)
                ->with('success', 'Jalur FO berhasil diperbarui');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for FO Route update', [
                'route_id' => $foRoute->id,
                'errors' => $e->errors(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Error updating FO Route', [
                'route_id' => $foRoute->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal memperbarui jalur FO: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified FO route
     */
    public function destroyRoute(FoRoute $foRoute)
    {
        $routeId = $foRoute->id;

        DB::transaction(function () use ($foRoute) {
            // Delete related FO points by route name and area
            FoPoint::where('route_name', $foRoute->name)
                ->where('area', $foRoute->area)
                ->delete();

            // Delete the route itself
            $foRoute->delete();
        });

        // Invalidate cache for deleted route
        $this->invalidateRouteCache($routeId);

        return back()->with('success', 'Jalur FO dan titik-titik terkait berhasil dihapus');
    }

    /**
     * Bulk actions for FO points
     */
    public function bulkPointsAction(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|in:activate,deactivate,maintenance,delete',
            'point_ids' => 'required|array|min:1',
            'point_ids.*' => 'integer|exists:fo_points,id',
        ]);

        // Get affected points first to determine which routes to invalidate
        $affectedPoints = FoPoint::whereIn('id', $validated['point_ids'])->get();
        $affectedRouteIds = [];

        foreach ($affectedPoints as $point) {
            $route = FoRoute::where('name', $point->route_name)
                ->where('area', $point->area)
                ->first();
            if ($route) {
                $affectedRouteIds[] = $route->id;
            }
        }

        $affectedRouteIds = array_unique($affectedRouteIds);

        $points = FoPoint::whereIn('id', $validated['point_ids']);

        switch ($validated['action']) {
            case 'activate':
                $points->update(['status' => 'active']);
                $message = 'Titik FO berhasil diaktifkan';
                break;
            case 'deactivate':
                $points->update(['status' => 'inactive']);
                $message = 'Titik FO berhasil dinonaktifkan';
                break;
            case 'maintenance':
                $points->update(['status' => 'maintenance']);
                $message = 'Titik FO berhasil diatur ke status maintenance';
                break;
            case 'delete':
                $points->delete();
                $message = 'Titik FO berhasil dihapus';
                break;
        }

        // Invalidate cache for all affected routes
        $this->invalidateMultipleRoutesCache($affectedRouteIds);

        return back()->with('success', $message);
    }

    /**
     * Bulk actions for FO routes
     */
    public function bulkRoutesAction(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|in:activate,deactivate,maintenance,delete',
            'route_ids' => 'required|array|min:1',
            'route_ids.*' => 'integer|exists:fo_routes,id',
        ]);

        $routeIds = $validated['route_ids'];
        $routes = FoRoute::whereIn('id', $routeIds);

        switch ($validated['action']) {
            case 'activate':
                $routes->update(['status' => 'active']);
                $message = 'Jalur FO berhasil diaktifkan';
                break;
            case 'deactivate':
                $routes->update(['status' => 'inactive']);
                $message = 'Jalur FO berhasil dinonaktifkan';
                break;
            case 'maintenance':
                $routes->update(['status' => 'maintenance']);
                $message = 'Jalur FO berhasil diatur ke status maintenance';
                break;
            case 'delete':
                DB::transaction(function () use ($routes) {
                    // Get routes to delete first (id, name, area)
                    $routesToDelete = $routes->get(['id', 'name', 'area']);

                    // Delete all related FO points for each route
                    foreach ($routesToDelete as $route) {
                        FoPoint::where('route_name', $route->name)
                            ->where('area', $route->area)
                            ->delete();
                    }

                    // Delete the routes themselves
                    FoRoute::whereIn('id', $routesToDelete->pluck('id'))->delete();
                });
                $message = 'Jalur FO beserta titik-titik terkait berhasil dihapus';
                break;
        }

        // Invalidate cache for all affected routes
        $this->invalidateMultipleRoutesCache($routeIds);

        return back()->with('success', $message);
    }

    /**
     * Export FO points as CSV
     */
    public function exportPoints(Request $request): StreamedResponse
    {
        $fileName = 'fo_points_'.date('Ymd_His').'.csv';

        $query = FoPoint::query();
        if ($area = $request->get('area')) {
            $query->where('area', $area);
        }
        if (($status = $request->get('status')) && $status !== 'all') {
            $query->where('status', $status);
        }
        if (($type = $request->get('type')) && $type !== 'all') {
            $query->where('type', $type);
        }
        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $columns = [
            'ID', 'Name', 'Latitude', 'Longitude', 'Area', 'Type', 'Status',
            'Route Name', 'Sequence Number', 'Description', 'ISP Image', 'Pole Image', 'Junction Box Image', 'Created At', 'Updated At',
        ];

        return response()->streamDownload(function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $columns);

            foreach ($query->orderBy('id')->cursor() as $point) {
                fputcsv($handle, [
                    $point->id,
                    $point->name,
                    (float) $point->latitude,
                    (float) $point->longitude,
                    $point->area,
                    $point->type,
                    $point->status,
                    $point->route_name,
                    (int) $point->sequence_number,
                    (string) ($point->description ?? ''),
                    (string) ($point->isp_image ?? ''),
                    (string) ($point->pole_image ?? ''),
                    (string) ($point->junction_box_image ?? ''),
                    optional($point->created_at)->format('Y-m-d H:i:s'),
                    optional($point->updated_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export FO routes as CSV
     */
    public function exportRoutes(Request $request): StreamedResponse
    {
        $fileName = 'fo_routes_'.date('Ymd_His').'.csv';

        $query = FoRoute::query();
        if ($area = $request->get('area')) {
            $query->where('area', $area);
        }
        if (($status = $request->get('status')) && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $columns = [
            'ID', 'Name', 'Area', 'Status', 'Color', 'Total Distance (km)',
            'Total Points', 'Description', 'Created At', 'Updated At',
        ];

        return response()->streamDownload(function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $columns);

            foreach ($query->orderBy('id')->cursor() as $route) {
                fputcsv($handle, [
                    $route->id,
                    $route->name,
                    $route->area,
                    $route->status,
                    (string) ($route->color ?? ''),
                    (float) ($route->total_distance ?? 0),
                    (int) ($route->total_points ?? 0),
                    (string) ($route->description ?? ''),
                    optional($route->created_at)->format('Y-m-d H:i:s'),
                    optional($route->updated_at)->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Invalidate cache for a specific route's GeoJSON data
     * Called when route or its points are modified
     */
    private function invalidateRouteCache($routeId)
    {
        try {
            $route = FoRoute::find($routeId);
            if (! $route) {
                \Log::warning('Cannot invalidate cache - route not found', ['route_id' => $routeId]);

                return;
            }

            // Clear all cache entries for this route (regardless of timestamp)
            $pattern = "fo_route_geojson_{$routeId}_*";

            // For file/database cache drivers, we can use forget with the exact key
            // Since updated_at might have changed, we'll clear potential old entries
            // by iterating through a reasonable time range (last 30 days)
            for ($i = 0; $i < 30; $i++) {
                $timestamp = now()->subDays($i)->timestamp;
                $cacheKey = "fo_route_geojson_{$routeId}_{$timestamp}";
                Cache::forget($cacheKey);
            }

            // Also clear the current timestamp key
            $currentKey = "fo_route_geojson_{$routeId}_{$route->updated_at->timestamp}";
            Cache::forget($currentKey);

            \Log::info('Cache invalidated for route', [
                'route_id' => $routeId,
                'route_name' => $route->name,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error invalidating route cache', [
                'route_id' => $routeId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate cache for multiple routes
     */
    private function invalidateMultipleRoutesCache(array $routeIds)
    {
        foreach ($routeIds as $routeId) {
            $this->invalidateRouteCache($routeId);
        }
    }

    /**
     * Helper methods for labels and calculations
     */
    private function getTypeLabel($type)
    {
        return match ($type) {
            'pole' => 'Tiang/Pole',
            'junction' => 'Junction Box',
            'hub' => 'Hub',
            'endpoint' => 'Endpoint',
            default => ucfirst($type)
        };
    }

    private function getStatusLabel($status)
    {
        return match ($status) {
            'active' => 'Aktif',
            'inactive' => 'Non-aktif',
            'maintenance' => 'Maintenance',
            default => ucfirst($status)
        };
    }

    private function calculateCoveragePercentage($area)
    {
        try {
            $activeRoutes = FoRoute::when($area, fn ($q) => $q->where('area', $area))->where('status', 'active')->count();
            $totalRoutes = FoRoute::when($area, fn ($q) => $q->where('area', $area))->count();

            return $totalRoutes > 0 ? round(($activeRoutes / $totalRoutes) * 100, 1) : 0.0;
        } catch (\Exception $e) {
            \Log::warning('Error calculating coverage percentage: '.$e->getMessage());

            return 0.0;
        }
    }

    private function calculateHealthScore($area)
    {
        try {
            $activePoints = FoPoint::when($area, fn ($q) => $q->where('area', $area))->where('status', 'active')->count();
            $totalPoints = FoPoint::when($area, fn ($q) => $q->where('area', $area))->count();
            $activeRoutes = FoRoute::when($area, fn ($q) => $q->where('area', $area))->where('status', 'active')->count();
            $totalRoutes = FoRoute::when($area, fn ($q) => $q->where('area', $area))->count();

            if ($totalPoints == 0 && $totalRoutes == 0) {
                return 100.0;
            }

            $pointsHealth = $totalPoints > 0 ? ($activePoints / $totalPoints) * 100 : 100;
            $routesHealth = $totalRoutes > 0 ? ($activeRoutes / $totalRoutes) * 100 : 100;

            return round(($pointsHealth + $routesHealth) / 2, 1);
        } catch (\Exception $e) {
            \Log::warning('Error calculating health score: '.$e->getMessage());

            return 0.0;
        }
    }

    /**
     * Update route statistics based on its points
     */
    private function updateRouteStatistics($routeId)
    {
        $route = FoRoute::findOrFail($routeId);

        // Get all points for this route ordered by sequence
        $points = FoPoint::where('route_name', $route->name)
            ->where('area', $route->area)
            ->orderBy('sequence_number')
            ->get();

        // Build coordinates array from points
        $coordinates = $points->map(function ($point) {
            return [
                'lat' => (float) $point->latitude,
                'lng' => (float) $point->longitude,
            ];
        })->toArray();

        // Calculate total distance if we have points
        $totalDistance = 0;
        if (count($coordinates) > 1 && method_exists($route, 'calculateDistance')) {
            $route->path_coordinates = $coordinates;
            $totalDistance = $route->calculateDistance();
        }

        // Update route with new statistics
        $route->update([
            'total_points' => $points->count(),
            'path_coordinates' => $coordinates,
            'total_distance' => $totalDistance,
        ]);
    }
}
