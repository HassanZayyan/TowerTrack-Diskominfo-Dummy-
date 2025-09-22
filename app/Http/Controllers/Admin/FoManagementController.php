<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FoRoute;
use App\Models\FoPoint;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FoManagementController extends Controller
{
    /**
     * Display list of FO routes (main entry point)
     */
    public function routesList(Request $request)
    {
        $area = $request->get('area', 'ungaran');
        
        // Get FO Routes with pagination
        $foRoutes = FoRoute::when($area, fn($q) => $q->where('area', $area))
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
                ];
            });

        // Get comprehensive statistics for routes
        $stats = [
            'total_routes' => FoRoute::when($area, fn($q) => $q->where('area', $area))->count(),
            'active_routes' => FoRoute::when($area, fn($q) => $q->where('area', $area))->where('status', 'active')->count(),
            'inactive_routes' => FoRoute::when($area, fn($q) => $q->where('area', $area))->where('status', 'inactive')->count(),
            'maintenance_routes' => FoRoute::when($area, fn($q) => $q->where('area', $area))->where('status', 'maintenance')->count(),
            'total_distance' => (float) FoRoute::when($area, fn($q) => $q->where('area', $area))->sum('total_distance'),
            'total_points' => FoRoute::when($area, fn($q) => $q->where('area', $area))->sum('total_points'),
            'health_score' => $this->calculateHealthScore($area),
        ];

        return Inertia::render('Admin/FoManagement/RoutesList', [
            'routes' => $foRoutes,
            'stats' => $stats,
            'currentArea' => $area,
            'availableAreas' => ['ungaran', 'ambarawa'],
        ]);
    }

    /**
     * Display detail of a specific FO route with its points
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

        // Format route data
        $routeData = [
            'id' => $foRoute->id,
            'name' => $foRoute->name,
            'area' => $foRoute->area,
            'status' => $foRoute->status,
            'color' => $foRoute->color,
            'total_distance' => (float) ($foRoute->total_distance ?? 0),
            'total_points' => (int) ($foRoute->total_points ?? 0),
            'description' => $foRoute->description,
            'path_coordinates' => $foRoute->path_coordinates,
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
     * Show the form for creating a new FO point
     */
    public function createPoint(Request $request)
    {
        $routeId = $request->get('route_id');
        $routeName = $request->get('route_name');
        $area = $request->get('area', 'ungaran');

        // Get available routes for dropdown
        $availableRoutes = FoRoute::when($area, fn($q) => $q->where('area', $area))
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

        return Inertia::render('Admin/FoManagement/PointCreate', [
            'availableAreas' => ['ungaran', 'ambarawa'],
            'availableTypes' => ['pole', 'junction', 'hub', 'endpoint'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
            'availableRoutes' => $availableRoutes,
            'preSelectedRoute' => $routeId ? [
                'id' => $routeId,
                'name' => $routeName,
                'area' => $area
            ] : null,
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
            'area' => 'required|in:ungaran,ambarawa',
            'type' => 'required|in:pole,junction,hub,endpoint',
            'status' => 'required|in:active,inactive,maintenance',
            'route_name' => 'required|string|max:255',
            'sequence_number' => 'required|integer|min:1',
            'description' => 'nullable|string|max:1000',
        ]);

        $point = FoPoint::create($validated);

        // Update associated route's total_points and recalculate distance if needed
        $route = FoRoute::where('name', $validated['route_name'])
            ->where('area', $validated['area'])
            ->first();
        
        if ($route) {
            $route->updateTotalPoints();
            
            // Redirect to route detail if we came from there
            $routeId = $request->get('route_id');
            if ($routeId) {
                return redirect()
                    ->route('admin.fo-management.routes.detail', $route->id)
                    ->with('success', 'Titik FO berhasil ditambahkan');
            }
        }

        // Default redirect
        return redirect()
            ->route('admin.fo-management.routes.list')
            ->with('success', 'Titik FO berhasil ditambahkan');
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
            ],
            'availableAreas' => ['ungaran', 'ambarawa'],
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
            'area' => 'required|in:ungaran,ambarawa',
            'type' => 'required|in:pole,junction,hub,endpoint',
            'status' => 'required|in:active,inactive,maintenance',
            'route_name' => 'required|string|max:255',
            'sequence_number' => 'required|integer|min:1',
            'description' => 'nullable|string|max:1000',
        ]);

        $oldRouteName = $foPoint->route_name;
        $oldArea = $foPoint->area;
        
        $foPoint->update($validated);

        // Update route totals for old route if route changed
        if ($oldRouteName !== $validated['route_name'] || $oldArea !== $validated['area']) {
            $oldRoute = FoRoute::where('name', $oldRouteName)->where('area', $oldArea)->first();
            if ($oldRoute) {
                $oldRoute->updateTotalPoints();
            }
        }

        // Update route totals for new route
        $newRoute = FoRoute::where('name', $validated['route_name'])
            ->where('area', $validated['area'])
            ->first();
        if ($newRoute) {
            $newRoute->updateTotalPoints();
            
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

        // Update associated route's total_points
        $route = FoRoute::where('name', $routeName)->where('area', $area)->first();
        if ($route) {
            $route->updateTotalPoints();
        }

        return back()->with('success', 'Titik FO berhasil dihapus');
    }

    /**
     * Show the form for creating a new FO route
     */
    public function createRoute()
    {
        return Inertia::render('Admin/FoManagement/RouteCreate', [
            'availableAreas' => ['ungaran', 'ambarawa'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
        ]);
    }

    /**
     * Store a newly created FO route
     */
    public function storeRoute(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive,maintenance',
            'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
            'path_coordinates' => 'required|array|min:2',
            'path_coordinates.*.lat' => 'required|numeric|between:-90,90',
            'path_coordinates.*.lng' => 'required|numeric|between:-180,180',
        ]);

        $route = FoRoute::create($validated);
        
        // Calculate and save total distance
        if (method_exists($route, 'calculateDistance')) {
            $route->total_distance = $route->calculateDistance();
            $route->save();
        }

        return redirect()
            ->route('admin.fo-management.routes.list')
            ->with('success', 'Jalur FO berhasil ditambahkan');
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
            'availableAreas' => ['ungaran', 'ambarawa'],
            'availableStatuses' => ['active', 'inactive', 'maintenance'],
        ]);
    }

    /**
     * Update the specified FO route
     */
    public function updateRoute(Request $request, FoRoute $foRoute)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,inactive,maintenance',
            'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
            'path_coordinates' => 'required|array|min:2',
            'path_coordinates.*.lat' => 'required|numeric|between:-90,90',
            'path_coordinates.*.lng' => 'required|numeric|between:-180,180',
        ]);

        $foRoute->update($validated);
        
        // Recalculate total distance
        if (method_exists($foRoute, 'calculateDistance')) {
            $foRoute->total_distance = $foRoute->calculateDistance();
            $foRoute->save();
        }

        return redirect()
            ->route('admin.fo-management.routes.list')
            ->with('success', 'Jalur FO berhasil diperbarui');
    }

    /**
     * Remove the specified FO route
     */
    public function destroyRoute(FoRoute $foRoute)
    {
        $foRoute->delete();

        return back()->with('success', 'Jalur FO berhasil dihapus');
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

        $routes = FoRoute::whereIn('id', $validated['route_ids']);

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
                $routes->delete();
                $message = 'Jalur FO berhasil dihapus';
                break;
        }

        return back()->with('success', $message);
    }

    /**
     * Export FO points as CSV
     */
    public function exportPoints(Request $request): StreamedResponse
    {
        $fileName = 'fo_points_' . date('Ymd_His') . '.csv';

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
            'Route Name', 'Sequence Number', 'Description', 'Created At', 'Updated At'
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
        $fileName = 'fo_routes_' . date('Ymd_His') . '.csv';

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
            'Total Points', 'Description', 'Created At', 'Updated At'
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
     * Helper methods for labels and calculations
     */
    private function getTypeLabel($type)
    {
        return match($type) {
            'pole' => 'Tiang/Pole',
            'junction' => 'Junction Box',
            'hub' => 'Hub',
            'endpoint' => 'Endpoint',
            default => ucfirst($type)
        };
    }

    private function getStatusLabel($status)
    {
        return match($status) {
            'active' => 'Aktif',
            'inactive' => 'Non-aktif',
            'maintenance' => 'Maintenance',
            default => ucfirst($status)
        };
    }

    private function calculateCoveragePercentage($area)
    {
        try {
            $activeRoutes = FoRoute::when($area, fn($q) => $q->where('area', $area))->where('status', 'active')->count();
            $totalRoutes = FoRoute::when($area, fn($q) => $q->where('area', $area))->count();
            
            return $totalRoutes > 0 ? round(($activeRoutes / $totalRoutes) * 100, 1) : 0.0;
        } catch (\Exception $e) {
            \Log::warning('Error calculating coverage percentage: ' . $e->getMessage());
            return 0.0;
        }
    }

    private function calculateHealthScore($area)
    {
        try {
            $activePoints = FoPoint::when($area, fn($q) => $q->where('area', $area))->where('status', 'active')->count();
            $totalPoints = FoPoint::when($area, fn($q) => $q->where('area', $area))->count();
            $activeRoutes = FoRoute::when($area, fn($q) => $q->where('area', $area))->where('status', 'active')->count();
            $totalRoutes = FoRoute::when($area, fn($q) => $q->where('area', $area))->count();
            
            if ($totalPoints == 0 && $totalRoutes == 0) return 100.0;
            
            $pointsHealth = $totalPoints > 0 ? ($activePoints / $totalPoints) * 100 : 100;
            $routesHealth = $totalRoutes > 0 ? ($activeRoutes / $totalRoutes) * 100 : 100;
            
            return round(($pointsHealth + $routesHealth) / 2, 1);
        } catch (\Exception $e) {
            \Log::warning('Error calculating health score: ' . $e->getMessage());
            return 0.0;
        }
    }
}
