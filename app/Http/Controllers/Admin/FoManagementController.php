<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FoPoint;
use App\Models\FoProvider;
use App\Models\FoRoute;
use App\Imports\FoPointsImport;
use App\Imports\FoPointsTemplateExport;
use App\Rules\GoogleDriveUrl;
use App\Services\CacheService;
use App\Traits\HasFoPointValidation;
use App\Traits\HasFoRouteStatistics;
use App\Traits\HasGeoJsonGeneration;
use App\Traits\HasCacheInvalidation;
use App\Helpers\ExcelHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FoManagementController extends Controller
{
    use HasFoPointValidation, HasFoRouteStatistics, HasGeoJsonGeneration, HasCacheInvalidation;
    /**
     * Display list of FO routes (main entry point)
     * Optimized: path_coordinates excluded to reduce payload size
     */
    public function routesList(Request $request): Response
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
    public function getRouteGeoJson(FoRoute $foRoute): JsonResponse
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

            // Step 3: Cache miss - ensure GeoJSON exists and is up-to-date
            // DRY: Use reusable method to check and generate GeoJSON if needed
            $geoJsonResult = $this->ensureGeoJsonForRoute($foRoute, 'admin');
            $needsGeneration = $geoJsonResult['needs_generation'];
            $foRoute = $geoJsonResult['route'];

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
                    'updated_at' => $foRoute->updated_at ? $foRoute->updated_at->timestamp : null, // For cache validation
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
    public function routeDetail(Request $request, FoRoute $foRoute): Response
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
    public function createPoint(FoRoute $foRoute): Response
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
            'availableProviders' => $this->getAvailableProviders(), // DRY: Use helper method
        ]);
    }

    /**
     * Store a newly created FO point
     */
    public function storePoint(Request $request): RedirectResponse
    {
        // DRY: Use reusable validation rules from trait
        $validated = $request->validate($this->getFoPointValidationRules(includeProviders: true, includeRouteId: true, includeImages: true));

        // Normalize image fields
        $this->normalizeImageFields($validated); // DRY: Use helper method

        // Extract providers and route_id
        $routeId = $validated['route_id'];
        $providers = $validated['providers'] ?? [];
        unset($validated['route_id'], $validated['providers']);

        $point = FoPoint::create($validated);

        // Sync providers if provided
        if (! empty($providers)) {
            $syncData = $this->buildProviderSyncData($providers); // DRY: Use helper method
            $point->providers()->sync($syncData);
        }

        // Best Practice: Touch route and invalidate cache (ensures cache key changes)
        // GeoJSON will be regenerated on-demand when user next selects this route
        $this->touchRouteAndInvalidateCache($routeId);

        // Invalidate FO points cache for data-fo page
        $this->invalidateFoPointsCache($validated['area']);

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
    public function editPoint(FoPoint $foPoint, Request $request): Response
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
                'side_of_road' => $foPoint->side_of_road,
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
            'availableProviders' => $this->getAvailableProviders(), // DRY: Use helper method
            'currentProviders' => $this->getCurrentProviders($foPoint), // DRY: Use helper method - Returns objects with id and name
            'fromRouteDetail' => $request->get('from_route'),
            'parentRouteId' => optional(FoRoute::where('name', $foPoint->route_name)
                ->where('area', $foPoint->area)
                ->first())->id,
        ]);
    }

    /**
     * Update the specified FO point
     */
    public function updatePoint(Request $request, FoPoint $foPoint): RedirectResponse
    {
        // DRY: Use reusable validation rules from trait
        $validated = $request->validate($this->getFoPointValidationRules(includeProviders: true, includeRouteId: false, includeImages: true));

        // Normalize image fields
        $this->normalizeImageFields($validated); // DRY: Use helper method

        $oldRouteName = $foPoint->route_name;
        $oldArea = $foPoint->area;

        // Extract providers
        $providers = $validated['providers'] ?? [];
        unset($validated['providers']);

        $foPoint->update($validated);

        // Sync providers
        $syncData = $this->buildProviderSyncData($providers); // DRY: Use helper method
        $foPoint->providers()->sync($syncData);

        // Invalidate FO points cache for data-fo page
        $this->invalidateFoPointsCache($validated['area']);
        if ($oldArea !== $validated['area']) {
            $this->invalidateFoPointsCache($oldArea);
        }

        // Update route totals for old route if route changed
        if ($oldRouteName !== $validated['route_name'] || $oldArea !== $validated['area']) {
            $oldRoute = FoRoute::where('name', $oldRouteName)->where('area', $oldArea)->first();
            if ($oldRoute) {
                // Best Practice: Touch route and invalidate cache (ensures cache key changes)
                $this->touchRouteAndInvalidateCache($oldRoute);
            }
        }

        // Update route totals for new route
        $newRoute = FoRoute::where('name', $validated['route_name'])
            ->where('area', $validated['area'])
            ->first();
        if ($newRoute) {
            // Best Practice: Touch route and invalidate cache (ensures cache key changes)
            $this->touchRouteAndInvalidateCache($newRoute);

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
     * Update only coordinates for a point (for drag-and-drop functionality)
     * Uses Opsi A: Auto-invalidate cache, regenerate on-demand
     */
    public function updatePointCoordinates(Request $request, FoPoint $foPoint): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $oldLatitude = $foPoint->latitude;
        $oldLongitude = $foPoint->longitude;

        // Update coordinates
        $foPoint->update([
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        // Invalidate FO points cache for data-fo page
        $this->invalidateFoPointsCache($foPoint->area);

        // Get associated route
        $route = FoRoute::where('name', $foPoint->route_name)
                       ->where('area', $foPoint->area)
                       ->first();

        if ($route) {
            // Best Practice: Touch route and invalidate cache (ensures cache key changes)
            // GeoJSON will regenerate on-demand when route is loaded
            $this->touchRouteAndInvalidateCache($route);

            \Log::info('Point coordinates updated via drag - GeoJSON will regenerate on-demand', [
                'point_id' => $foPoint->id,
                'route_id' => $route->id,
                'old_coords' => [$oldLatitude, $oldLongitude],
                'new_coords' => [$validated['latitude'], $validated['longitude']],
                'note' => 'GeoJSON regeneration deferred until route is loaded (saves API tokens)',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Koordinat berhasil diperbarui. GeoJSON akan di-regenerate saat route di-load.',
            'data' => [
                'id' => $foPoint->id,
                'latitude' => $foPoint->latitude,
                'longitude' => $foPoint->longitude,
            ],
            'needs_regeneration' => true,
        ]);
    }

    /**
     * Remove the specified FO point
     */
    public function destroyPoint(FoPoint $foPoint): RedirectResponse
    {
        $routeName = $foPoint->route_name;
        $area = $foPoint->area;

        $foPoint->delete();

        // Invalidate FO points cache for data-fo page
        $this->invalidateFoPointsCache($area);

        // Update associated route's statistics
        $route = FoRoute::where('name', $routeName)->where('area', $area)->first();
        if ($route) {
            // Best Practice: Touch route and invalidate cache (ensures cache key changes)
            $this->touchRouteAndInvalidateCache($route);
        }

        return back()->with('success', 'Titik FO berhasil dihapus');
    }

    /**
     * Show the form for creating a new FO route
     */
    public function createRoute(): Response
    {
        return Inertia::render('Admin/FoManagement/RouteCreate', [
            'availableAreas' => ['ungaran'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
        ]);
    }

    /**
     * Store a newly created FO route
     */
    public function storeRoute(Request $request): RedirectResponse
    {
        try {
            // DRY: Use reusable validation rules from trait
            $validated = $request->validate(
                $this->getFoRouteValidationRules(includePathCoordinates: false)
            );

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
    public function editRoute(FoRoute $foRoute): Response
    {
        // Get all points in this route (ordered by sequence)
        $points = FoPoint::where('route_name', $foRoute->name)
            ->where('area', $foRoute->area)
            ->orderBy('sequence_number')
            ->get()
            ->map(function ($point) {
                return [
                    'id' => $point->id,
                    'name' => $point->name,
                    'latitude' => (float) $point->latitude,
                    'longitude' => (float) $point->longitude,
                    'sequence_number' => $point->sequence_number,
                    'type' => $point->type,
                    'status' => $point->status,
                    'side_of_road' => $point->side_of_road,
                    'images' => [
                        'isp' => $point->isp_image,
                        'pole' => $point->pole_image,
                        'junction_box' => $point->junction_box_image,
                    ],
                ];
            });

        // Calculate map bounds
        $bounds = null;
        if ($points->isNotEmpty()) {
            $lats = $points->pluck('latitude')->filter();
            $lngs = $points->pluck('longitude')->filter();
            
            if ($lats->isNotEmpty() && $lngs->isNotEmpty()) {
                $bounds = [
                    'north' => $lats->max(),
                    'south' => $lats->min(),
                    'east' => $lngs->max(),
                    'west' => $lngs->min(),
                ];
            }
        }

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
            'points' => $points, // Add points data
            'mapBounds' => $bounds, // Add bounds for auto-fit
            'availableAreas' => ['ungaran'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
        ]);
    }

    /**
     * Update the specified FO route
     */
    public function updateRoute(Request $request, FoRoute $foRoute): RedirectResponse
    {
        try {
            // DRY: Use reusable validation rules from trait
            $validated = $request->validate(
                $this->getFoRouteValidationRules(includePathCoordinates: false)
            );

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

                // DRY: Use reusable route statistics update from trait
                $this->updateFoRouteStatistics($foRoute->id);
            }

            // Best Practice: Touch route and invalidate cache (ensures cache key changes)
            $this->touchRouteAndInvalidateCache($foRoute, updateStatistics: false);

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
    public function destroyRoute(FoRoute $foRoute): RedirectResponse
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

        // Invalidate cache for deleted route (route already deleted, just clear cache)
        // Note: No need to touch route since it's already deleted
        try {
            // Clear all possible cache keys for this route
            for ($i = 0; $i < 30; $i++) {
                $timestamp = now()->subDays($i)->timestamp;
                $cacheKey = "fo_route_geojson_{$routeId}_{$timestamp}";
                Cache::forget($cacheKey);
            }
            \Log::info('Cache invalidated for deleted route', ['route_id' => $routeId]);
        } catch (\Exception $e) {
            \Log::error('Error invalidating cache for deleted route', [
                'route_id' => $routeId,
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Jalur FO dan titik-titik terkait berhasil dihapus');
    }

    /**
     * Bulk actions for FO points
     */
    public function bulkPointsAction(Request $request): RedirectResponse
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
    public function bulkRoutesAction(Request $request): RedirectResponse
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

    // Cache invalidation methods moved to HasCacheInvalidation trait (DRY)

    /**
     * Helper methods for labels and calculations
     */
    private function getTypeLabel(string $type): string
    {
        return match ($type) {
            'pole' => 'Tiang/Pole',
            'junction' => 'Junction Box',
            'hub' => 'Hub',
            'endpoint' => 'Endpoint',
            default => ucfirst($type)
        };
    }

    /**
     * Get status label in Indonesian
     */
    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'active' => 'Aktif',
            'inactive' => 'Non-aktif',
            'maintenance' => 'Maintenance',
            default => ucfirst($status)
        };
    }

    /**
     * Calculate coverage percentage for an area
     */
    private function calculateCoveragePercentage(?string $area): float
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

    /**
     * Calculate health score for an area
     */
    private function calculateHealthScore(?string $area): float
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
     * Get available providers formatted for frontend
     * DRY: Reusable method untuk menghindari duplikasi query
     */
    private function getAvailableProviders(): array
    {
        return FoProvider::active()
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
    }

    /**
     * Get current providers for a point formatted for frontend
     * DRY: Consistent format dengan availableProviders
     */
    private function getCurrentProviders(FoPoint $foPoint): array
    {
        return $foPoint->providers()
            ->wherePivot('is_active', true)
            ->select('fo_providers.id', 'fo_providers.name')
            ->orderByPivot('sort_order')
            ->get()
            ->map(function ($provider) {
                return [
                    'id' => $provider->id,
                    'name' => $provider->name,
                ];
            })
            ->toArray();
    }

    /**
     * Build sync data for provider pivot table
     * DRY: Reusable method untuk sync providers
     */
    private function buildProviderSyncData(array $providerIds): array
    {
        $syncData = [];
        foreach ($providerIds as $index => $providerId) {
            $masterProvider = FoProvider::find($providerId);
            if ($masterProvider) {
                $syncData[$providerId] = [
                    'is_active' => true,
                    'sort_order' => $masterProvider->default_sort_order ?? $index,
                ];
            }
        }

        return $syncData;
    }

    /**
     * Normalize image fields to null if empty, dash, or whitespace-only
     * DRY: Handles edge cases for optional image fields
     */
    private function normalizeImageFields(array &$data): void
    {
        foreach (['isp_image', 'pole_image', 'junction_box_image'] as $field) {
            if (isset($data[$field])) {
                $value = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
                // Normalize empty strings, dashes, or whitespace-only strings to null
                if ($value === '' || $value === '-' || $value === null) {
                    $data[$field] = null;
                } else {
                    $data[$field] = $value;
                }
            }
        }
    }


    /**
     * Display a listing of providers
     * DRY: Provider management methods consolidated in FoManagementController
     */
    public function indexProviders(Request $request): Response
    {
        $providers = FoProvider::orderBy('default_sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($provider) {
                return [
                    'id' => $provider->id,
                    'name' => $provider->name,
                    'description' => $provider->description,
                    'default_sort_order' => $provider->default_sort_order,
                    'is_active' => $provider->is_active,
                    'points_count' => $provider->foPoints()->count(),
                    'created_at' => $provider->created_at->format('d M Y H:i'),
                    'updated_at' => $provider->updated_at->format('d M Y H:i'),
                ];
            });

        return Inertia::render('Admin/FoManagement/ProvidersIndex', [
            'providers' => $providers,
        ]);
    }

    /**
     * Store a newly created provider
     * DRY: Provider management methods consolidated in FoManagementController
     */
    public function storeProvider(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:fo_providers,name',
            'description' => 'nullable|string|max:500',
            'default_sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        // Get max sort order jika tidak disediakan
        if (! isset($validated['default_sort_order'])) {
            $maxSortOrder = FoProvider::max('default_sort_order') ?? 0;
            $validated['default_sort_order'] = $maxSortOrder + 1;
        }

        $provider = FoProvider::create($validated);

        return redirect()
            ->route('admin.fo-management.providers.index')
            ->with('success', 'Provider berhasil ditambahkan');
    }

    /**
     * Update the specified provider
     * DRY: Provider management methods consolidated in FoManagementController
     */
    public function updateProvider(Request $request, FoProvider $foProvider): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:fo_providers,name,'.$foProvider->id,
            'description' => 'nullable|string|max:500',
            'default_sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $foProvider->update($validated);

        return redirect()
            ->route('admin.fo-management.providers.index')
            ->with('success', 'Provider berhasil diperbarui');
    }

    /**
     * Remove the specified provider
     * DRY: Provider management methods consolidated in FoManagementController
     * Best Practice: Soft delete (is_active = false) if still used, hard delete if not used
     */
    public function destroyProvider(FoProvider $foProvider): RedirectResponse
    {
        // Check if provider is used by any points
        $pointsCount = $foProvider->foPoints()->count();

        if ($pointsCount > 0) {
            // Soft delete: set is_active = false instead of hard delete
            $foProvider->update(['is_active' => false]);

            return redirect()
                ->route('admin.fo-management.providers.index')
                ->with('success', "Provider '{$foProvider->name}' dinonaktifkan karena masih digunakan oleh {$pointsCount} titik FO. Data tetap tersimpan untuk keperluan audit.");
        }

        // Hard delete if not used by any points
        $foProvider->delete();

        return redirect()
            ->route('admin.fo-management.providers.index')
            ->with('success', 'Provider berhasil dihapus permanen');
    }

    /**
     * Quick create provider from point form
     * DRY: Reusable method untuk quick-add provider
     * Returns Inertia response for proper CSRF handling
     */
    public function quickCreateProvider(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:fo_providers,name',
            'description' => 'nullable|string|max:500',
        ]);

        // Get max sort order untuk menempatkan di akhir
        $maxSortOrder = FoProvider::max('default_sort_order') ?? 0;

        $provider = FoProvider::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'default_sort_order' => $maxSortOrder + 1,
            'is_active' => true,
        ]);

        // Return back with success message and new provider data
        // Inertia.js will handle the response properly
        return back()->with([
            'success' => 'Provider berhasil ditambahkan',
            'newProvider' => [
                'id' => $provider->id,
                'name' => $provider->name,
            ],
        ]);
    }

    /**
     * Show import form for FO Points
     */
    public function showImportFoPointsForm(): Response
    {
        // Get available routes
        $availableRoutes = FoRoute::select('id', 'name', 'area')
            ->orderBy('name')
            ->get()
            ->map(function ($route) {
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'area' => $route->area,
                ];
            });

        return Inertia::render('Admin/FoManagement/ImportFoPoints', [
            'templateUrl' => route('admin.fo-management.points.import.template'),
            'availableRoutes' => $availableRoutes,
            'availableProviders' => $this->getAvailableProviders(),
        ]);
    }

    /**
     * Preview import FO Points (before actual import)
     * DRY: Uses ExcelHelper for header detection and column mapping
     */
    public function previewImportFoPoints(Request $request): JsonResponse
    {
        $validated = $request->validate(
            ExcelHelper::getFileValidationRules(),
            ExcelHelper::getFileValidationMessages()
        );

        try {
            // Use ExcelHelper to find header row
            $headerResult = ExcelHelper::findHeaderRow($validated['file'], ['nama', 'lokasi', 'koordinat', 'nomor']);
            $cleanedHeaderRow = $headerResult['cleanedHeaderRow'];
            $headerRowIndex = $headerResult['headerRowIndex'];
            $startIndex = $headerResult['startIndex'];
            
            // Debug: Log header detection
            \Log::info('FO Points Import - Header Detection', [
                'headerRowIndex' => $headerRowIndex,
                'cleanedHeaderRow' => $cleanedHeaderRow,
                'startIndex' => $startIndex,
            ]);
            
            // Auto-detect mapping using cleaned header
            $import = new FoPointsImport();
            $detectedMapping = $import->detectColumnMapping($cleanedHeaderRow);
            
            // Build column index mapping using ExcelHelper
            $columnIndexMapping = ExcelHelper::buildColumnIndexMapping(
                $detectedMapping,
                $cleanedHeaderRow,
                $startIndex
            );
            
            // Determine start row for actual import (header row index + 1, 1-based)
            $startRowForImport = ($headerRowIndex ?? 0) + 1; // +1 because WithStartRow is 1-based
            
            // Validate required columns
            // Note: latitude/longitude can come from separate columns OR from coordinates column
            // Note: route_name is optional - will use defaultRouteId if not found
            $requiredColumns = ['name']; // route_name is optional, will use defaultRouteId
            $coordinateColumns = ['latitude', 'longitude', 'coordinates'];
            $hasCoordinateData = !empty(array_intersect($coordinateColumns, array_keys($detectedMapping)));
            
            $missingColumns = array_diff($requiredColumns, array_keys($detectedMapping));
            if (!$hasCoordinateData) {
                $missingColumns[] = 'latitude/longitude atau koordinat';
            }
            
            // Add warnings for optional but recommended columns
            $warnings = [];
            if (!isset($detectedMapping['route_name'])) {
                $warnings[] = 'Kolom "route_name" tidak ditemukan. Pastikan Anda memilih "Default Route" sebelum import, atau aktifkan "Auto Create Routes" untuk membuat route otomatis.';
            }
            
            // Preview data - read all rows to find actual data rows
            $allRows = Excel::toArray(new \stdClass(), $validated['file']);
            $preview = [];
            
            // Get preview rows (skip header row and empty rows, get next 10 data rows)
            if ($headerRowIndex !== null && !empty($allRows[0])) {
                $dataRows = array_slice($allRows[0], $headerRowIndex + 1);
                foreach ($dataRows as $row) {
                    // Skip empty rows
                    $nonEmptyValues = array_filter($row, function($v) { 
                        return !empty(trim($v ?? '')); 
                    });
                    if (empty($nonEmptyValues)) {
                        continue;
                    }
                    // Skip rows that look like headers (repeated headers in CSV)
                    $rowString = implode(' ', array_map('trim', $nonEmptyValues));
                    if (stripos($rowString, 'nomor') !== false && stripos($rowString, 'nama lokasi') !== false) {
                        continue;
                    }
                    $preview[] = $row;
                    if (count($preview) >= 10) {
                        break;
                    }
                }
            }
            
            // Convert preview rows to associative arrays using cleaned header row
            // Note: CSV may have empty columns at the start, so we use cleanedHeaderRow and startIndex
            $previewAssoc = [];
            foreach ($preview as $row) {
                $rowAssoc = [];
                // Use cleaned header row (without empty columns at start)
                foreach ($cleanedHeaderRow as $colIndex => $headerName) {
                    // Get value from data row using startIndex offset
                    $actualColIndex = $startIndex + $colIndex;
                    $rowAssoc[trim($headerName)] = $row[$actualColIndex] ?? null;
                }
                $previewAssoc[] = $rowAssoc;
            }
            $preview = $previewAssoc;
            
            // Validate preview rows
            $errors = [];
            foreach ($preview as $index => $row) {
                $rowErrors = [];
                
                // Check name - $row is now associative array with header names as keys
                $nameValue = null;
                if (isset($detectedMapping['name'])) {
                    // Try original header name first (exact match)
                    $nameValue = $row[$detectedMapping['name']] ?? null;
                    
                    // Try with trimmed version
                    if (empty($nameValue)) {
                        $nameValue = $row[trim($detectedMapping['name'])] ?? null;
                    }
                    
                    // Try normalized version
                    if (empty($nameValue)) {
                        $headerKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $detectedMapping['name'])));
                        $headerKey = preg_replace('/_+/', '_', $headerKey);
                        $nameValue = $row[$headerKey] ?? null;
                    }
                } else {
                    // If mapping not found, try common variations directly from row
                    $nameValue = $row['Nama Lokasi'] ?? $row['nama lokasi'] ?? $row['Nama_Lokasi'] ?? $row['nama_lokasi'] ?? null;
                }
                
                if (empty($nameValue) || trim($nameValue) === '' || trim($nameValue) === '-') {
                    $rowErrors[] = 'Name wajib diisi';
                }
                
                // Check coordinates - support both separate lat/lng and combined format
                $hasValidCoordinates = false;
                
                // Check if coordinates column exists (combined format)
                if (isset($detectedMapping['coordinates'])) {
                    // Try original header name first (exact match)
                    $coordinatesValue = $row[$detectedMapping['coordinates']] ?? null;
                    
                    // Try with trimmed version
                    if (empty($coordinatesValue)) {
                        $coordinatesValue = $row[trim($detectedMapping['coordinates'])] ?? null;
                    }
                    
                    // Try normalized version
                    if (empty($coordinatesValue)) {
                        $headerKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $detectedMapping['coordinates'])));
                        $headerKey = preg_replace('/_+/', '_', $headerKey);
                        $coordinatesValue = $row[$headerKey] ?? null;
                    }
                    
                    if (!empty($coordinatesValue) && trim($coordinatesValue) !== '-') {
                        // Try to parse coordinates (format: "lat,lng")
                        $coords = $this->parseCoordinatesForValidation($coordinatesValue);
                        if ($coords['latitude'] !== null && $coords['longitude'] !== null) {
                            $hasValidCoordinates = true;
                        }
                    }
                } else {
                    // If mapping not found, try common variations directly from row
                    $coordinatesValue = $row['Koordinat'] ?? $row['koordinat'] ?? $row['Koordinat'] ?? null;
                    if (!empty($coordinatesValue) && trim($coordinatesValue) !== '-') {
                        $coords = $this->parseCoordinatesForValidation($coordinatesValue);
                        if ($coords['latitude'] !== null && $coords['longitude'] !== null) {
                            $hasValidCoordinates = true;
                        }
                    }
                }
                
                // Check if latitude and longitude exist separately
                if (!$hasValidCoordinates) {
                    $latValue = null;
                    $lngValue = null;
                    
                    if (isset($detectedMapping['latitude'])) {
                        $latValue = $row[$detectedMapping['latitude']] ?? null;
                        if (empty($latValue)) {
                            $headerKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $detectedMapping['latitude'])));
                            $headerKey = preg_replace('/_+/', '_', $headerKey);
                            $latValue = $row[$headerKey] ?? null;
                        }
                    }
                    
                    if (isset($detectedMapping['longitude'])) {
                        $lngValue = $row[$detectedMapping['longitude']] ?? null;
                        if (empty($lngValue)) {
                            $headerKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $detectedMapping['longitude'])));
                            $headerKey = preg_replace('/_+/', '_', $headerKey);
                            $lngValue = $row[$headerKey] ?? null;
                        }
                    }
                    
                    if (!empty($latValue) && trim($latValue) !== '-' && !empty($lngValue) && trim($lngValue) !== '-') {
                        $hasValidCoordinates = true;
                    }
                }
                
                if (!$hasValidCoordinates) {
                    $rowErrors[] = 'Latitude wajib diisi';
                    $rowErrors[] = 'Longitude wajib diisi';
                }
                
                if (!empty($rowErrors)) {
                    $errors[] = [
                        'row' => $index + 2, // +2 karena header + 1-based
                        'errors' => $rowErrors
                    ];
                }
            }
            
            // Count total data rows using helper method
            $totalRows = $this->countDataRows($allRows[0] ?? [], $headerRowIndex);
            
            // Debug: Log total rows calculation
            \Log::info('FO Points Import - Total Rows Calculation', [
                'headerRowIndex' => $headerRowIndex,
                'totalRowsInFile' => count($allRows[0] ?? []),
                'totalRows' => $totalRows,
            ]);
            
            return response()->json([
                'success' => true,
                'detected_mapping' => $detectedMapping,
                'column_index_mapping' => $columnIndexMapping, // Pass column index mapping
                'missing_columns' => array_values($missingColumns),
                'warnings' => $warnings, // Add warnings for optional columns
                'preview' => $preview,
                'errors' => $errors,
                'can_import' => empty($missingColumns) && empty($errors),
                'total_rows' => $totalRows,
                'start_row_for_import' => $startRowForImport, // Pass start row to frontend
            ]);
        } catch (\Exception $e) {
            \Log::error('Error previewing FO points import', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membaca file: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Process import FO Points
     */
    public function importFoPoints(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240', // Excel only (template required)
            'mode' => 'required|in:insert,update,upsert',
            'default_route_id' => 'nullable|exists:fo_routes,id',
            'auto_create_routes' => 'nullable|boolean',
            'column_mapping' => 'nullable|array',
            'start_row' => 'nullable|integer|min:1', // Optional: start row from preview
            'column_index_mapping' => 'nullable|array', // Column index mapping for CSV with empty leading columns
        ]);

        try {
            $defaultRouteId = $validated['default_route_id'] ?? null;
            $autoCreateRoutes = $validated['auto_create_routes'] ?? false;
            $columnMapping = $validated['column_mapping'] ?? [];
            
            // Detect header row if start_row not provided
            $startRow = $validated['start_row'] ?? null;
            $hasRouteNameColumn = false;
            
            // Detect header row if start_row not provided
            if ($startRow === null) {
                // Use ExcelHelper to find header row
                $headerResult = ExcelHelper::findHeaderRow($validated['file'], ['nama', 'lokasi', 'koordinat', 'nomor']);
                $cleanedHeaderRow = $headerResult['cleanedHeaderRow'];
                $headerRowIndex = $headerResult['headerRowIndex'];
                $startIndex = $headerResult['startIndex'];
                
                // Check if route_name exists
                $import = new FoPointsImport();
                $detectedMapping = $import->detectColumnMapping($cleanedHeaderRow);
                $hasRouteNameColumn = isset($detectedMapping['route_name']);
                
                // Set start row (header row index + 1, 1-based)
                $startRow = ($headerRowIndex ?? 0) + 1;
                
                // Build column index mapping if not provided
                $columnIndexMapping = $validated['column_index_mapping'] ?? [];
                if (empty($columnIndexMapping)) {
                    $columnIndexMapping = ExcelHelper::buildColumnIndexMapping(
                        $detectedMapping,
                        $cleanedHeaderRow,
                        $startIndex
                    );
                }
                
                \Log::info('FO Points Import - Start Row Detection', [
                    'headerRowIndex' => $headerRowIndex,
                    'startRow' => $startRow,
                    'startIndex' => $startIndex,
                    'hasRouteNameColumn' => $hasRouteNameColumn,
                ]);
            } else {
                // If startRow is provided, we still need to check for route_name column
                $allRows = Excel::toArray(new \stdClass(), $validated['file']);
                $headerRowIndex = $startRow - 1;
                
                if (isset($allRows[0][$headerRowIndex])) {
                    $headerRow = $allRows[0][$headerRowIndex];
                    
                    // Clean header row
                    $startIndex = 0;
                    foreach ($headerRow as $index => $value) {
                        if (!empty(trim($value ?? ''))) {
                            $startIndex = $index;
                            break;
                        }
                    }
                    $cleanedHeaderRow = array_slice($headerRow, $startIndex);
                    
                    // Check if route_name exists
                    $import = new FoPointsImport();
                    $detectedMapping = $import->detectColumnMapping($cleanedHeaderRow);
                    $hasRouteNameColumn = isset($detectedMapping['route_name']);
                    
                    // Build column index mapping if not provided
                    $columnIndexMapping = $validated['column_index_mapping'] ?? [];
                    if (empty($columnIndexMapping)) {
                        $columnIndexMapping = ExcelHelper::buildColumnIndexMapping(
                            $detectedMapping,
                            $cleanedHeaderRow,
                            $startIndex
                        );
                    }
                } else {
                    $hasRouteNameColumn = false;
                    $columnIndexMapping = $validated['column_index_mapping'] ?? [];
                }
            }
            
            // Validate: If route_name is not in CSV, defaultRouteId or autoCreateRoutes must be set
            if (!$hasRouteNameColumn && empty($defaultRouteId) && !$autoCreateRoutes) {
                return back()->withErrors([
                    'default_route_id' => 'Kolom "route_name" tidak ditemukan di file. Silakan pilih "Default Route" atau aktifkan "Auto Create Routes" sebelum import.'
                ]);
            }
            
            $import = new FoPointsImport(
                $validated['mode'],
                $defaultRouteId,
                $autoCreateRoutes,
                $columnMapping,
                $startRow,
                $columnIndexMapping
            );
            
            \Log::info('FO Points Import - Starting import', [
                'mode' => $validated['mode'],
                'startRow' => $startRow,
                'defaultRouteId' => $defaultRouteId,
                'autoCreateRoutes' => $autoCreateRoutes,
                'columnIndexMapping' => $columnIndexMapping,
            ]);
            
            Excel::import($import, $validated['file']);
            
            \Log::info('FO Points Import - Import completed', [
                'rowCount' => $import->getRowCount(),
                'failures' => count($import->failures()),
            ]);

            $successCount = $import->getRowCount() - count($import->failures());
            $errorCount = count($import->failures());

            // Invalidate cache setelah import
            $this->invalidateFoPointsCache('ungaran'); // atau dari data yang diimport
            
            // Invalidate route caches jika ada route yang terpengaruh
            $affectedRoutes = FoRoute::where('area', 'ungaran')->get();
            foreach ($affectedRoutes as $route) {
                $this->touchRouteAndInvalidateCache($route);
            }

            $message = "Import FO Points berhasil: {$successCount} data berhasil diimport";
            if ($errorCount > 0) {
                $message .= ", {$errorCount} data gagal";
            }

            return redirect()
                ->route('admin.fo-management.routes.list')
                ->with([
                    'success' => $message,
                    'import_errors' => $import->failures(),
                    'error_count' => $errorCount,
                ]);
        } catch (\Exception $e) {
            \Log::error('Error importing FO points', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['file' => 'Import gagal: ' . $e->getMessage()]);
        }
    }

    /**
     * Download template for FO Points import
     */
    public function downloadFoPointsTemplate(): BinaryFileResponse
    {
        return Excel::download(
            new FoPointsTemplateExport(), 
            'template_import_fo_points_' . date('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Parse coordinates from string format "lat,lng" for validation
     * DRY: Uses ExcelHelper::parseCoordinates()
     */
    protected function parseCoordinatesForValidation(?string $coordinateString): array
    {
        return ExcelHelper::parseCoordinates($coordinateString);
    }

    /**
     * Count data rows in Excel file (excluding headers and empty rows)
     * DRY: Helper method for row counting logic
     */
    protected function countDataRows(array $allRows, ?int $headerRowIndex): int
    {
        $totalRows = 0;
        
        foreach ($allRows as $index => $row) {
            // Skip header row
            if ($headerRowIndex !== null && $index === $headerRowIndex) {
                continue;
            }
            
            // Skip completely empty rows
            $nonEmptyValues = array_filter($row, function($v) { 
                $trimmed = trim($v ?? '');
                return !empty($trimmed) && $trimmed !== '-';
            });
            if (empty($nonEmptyValues)) {
                continue;
            }
            
            $rowString = implode(' ', array_map('trim', $nonEmptyValues));
            
            // Check if this row is a header (has "Nomor" and "Nama Lokasi" or "Koordinat")
            $isHeader = (stripos($rowString, 'nomor') !== false) && 
                        ((stripos($rowString, 'nama lokasi') !== false) || 
                         (stripos($rowString, 'nama_lokasi') !== false) ||
                         (stripos($rowString, 'koordinat') !== false));
            
            if ($isHeader) {
                continue; // Skip header row
            }
            
            // Check if this row has data characteristics
            $hasSequenceNumber = isset($row[3]) && !empty(trim($row[3])) && is_numeric(trim($row[3]));
            $hasName = isset($row[4]) && !empty(trim($row[4])) && trim($row[4]) !== '-';
            $hasCoordinates = false;
            
            // Check column 5 for coordinates
            if (isset($row[5]) && !empty(trim($row[5]))) {
                $col5 = trim($row[5]);
                if ($col5 !== '-' && preg_match('/-?\d+\.?\d*\s*,\s*-?\d+\.?\d*/', $col5)) {
                    $hasCoordinates = true;
                }
            }
            
            // Also check all columns for coordinates pattern
            if (!$hasCoordinates) {
                foreach ($row as $value) {
                    $trimmed = trim($value ?? '');
                    if (!empty($trimmed) && $trimmed !== '-' && preg_match('/-?\d+\.?\d*\s*,\s*-?\d+\.?\d*/', $trimmed)) {
                        $hasCoordinates = true;
                        break;
                    }
                }
            }
            
            // Count as data row if it has sequence number OR (coordinates and name)
            if ($hasSequenceNumber || ($hasCoordinates && $hasName)) {
                $totalRows++;
            }
        }
        
        return $totalRows;
    }
}
