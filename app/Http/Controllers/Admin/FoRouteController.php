<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FoRoute;
use App\Models\FoPoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FoRouteController extends Controller
{
    public function index(Request $request)
    {
        $area = $request->get('area', 'ungaran');

        $routes = FoRoute::when($area, fn($q) => $q->where('area', $area))
            ->orderBy('name')
            ->paginate(15)
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
                ];
            });

        return Inertia::render('Admin/FoRoutes', [
            'routes' => $routes,
            'area' => $area,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/FoRouteEdit', [
            'mode' => 'create',
            'areas' => ['ungaran', 'ambarawa'],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
            'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
            'path_coordinates' => 'required|array|min:2',
            'path_coordinates.*.lat' => 'required|numeric|between:-90,90',
            'path_coordinates.*.lng' => 'required|numeric|between:-180,180',
        ]);

        $route = FoRoute::create($validated);
        $route->update(['total_distance' => $route->calculateDistance()]);

        return redirect()->route('admin.fo-routes.index')->with('success', 'Jalur FO berhasil dibuat');
    }

    public function edit(FoRoute $foRoute)
    {
        return Inertia::render('Admin/FoRouteEdit', [
            'mode' => 'edit',
            'route' => [
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
            'areas' => ['ungaran', 'ambarawa'],
        ]);
    }

    public function update(Request $request, FoRoute $foRoute)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive,maintenance',
            'color' => 'nullable|string|regex:/^#(?:[0-9a-fA-F]{3}){1,2}$/',
            'path_coordinates' => 'required|array|min:2',
            'path_coordinates.*.lat' => 'required|numeric|between:-90,90',
            'path_coordinates.*.lng' => 'required|numeric|between:-180,180',
        ]);

        $foRoute->update($validated);
        $foRoute->update(['total_distance' => $foRoute->calculateDistance()]);

        return redirect()->route('admin.fo-routes.index')->with('success', 'Jalur FO berhasil diperbarui');
    }

    public function destroy(FoRoute $foRoute)
    {
        $foRoute->delete();
        return back()->with('success', 'Jalur FO berhasil dihapus');
    }
}


