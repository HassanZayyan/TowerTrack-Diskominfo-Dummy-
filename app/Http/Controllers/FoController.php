<?php

namespace App\Http\Controllers;

use App\Models\FoPoint;
use App\Models\FoRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FoController extends Controller
{
    /**
     * Display the FO data page
     */
    public function index(Request $request)
    {
        $area = $request->get('area', 'ungaran'); // Default ke ungaran
        
        // Get FO points by area
        $foPoints = FoPoint::where('area', $area)->where('status', 'active')->get();
        
        // Get FO routes by area
        $foRoutes = FoRoute::where('area', $area)->where('status', 'active')->get();
        
        return Inertia::render('DataFo/Index', [
            'foPoints' => $foPoints,
            'foRoutes' => $foRoutes,
            'currentArea' => $area,
            'availableAreas' => ['ungaran', 'ambarawa'],
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
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string',
            'type' => 'required|string|in:pole,junction,hub,endpoint',
            'status' => 'required|string|in:active,inactive,maintenance',
        ]);

        $foPoint = FoPoint::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Titik FO berhasil ditambahkan',
            'data' => $foPoint
        ]);
    }

    /**
     * Store a new FO route
     */
    public function storeRoute(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran,ambarawa',
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
            'data' => $foRoute
        ]);
    }

    /**
     * Update FO point
     */
    public function updatePoint(Request $request, FoPoint $foPoint)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string',
            'type' => 'required|string|in:pole,junction,hub,endpoint',
            'status' => 'required|string|in:active,inactive,maintenance',
        ]);

        $foPoint->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Titik FO berhasil diperbarui',
            'data' => $foPoint
        ]);
    }

    /**
     * Update FO route
     */
    public function updateRoute(Request $request, FoRoute $foRoute)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'area' => 'required|in:ungaran,ambarawa',
            'description' => 'nullable|string',
            'path_coordinates' => 'required|array|min:2',
            'path_coordinates.*.lat' => 'required|numeric|between:-90,90',
            'path_coordinates.*.lng' => 'required|numeric|between:-180,180',
            'color' => 'nullable|string|max:7',
            'status' => 'required|string|in:active,inactive,maintenance',
        ]);

        $foRoute->update($validated);
        
        // Recalculate total distance
        $foRoute->total_distance = $foRoute->calculateDistance();
        $foRoute->save();

        return response()->json([
            'success' => true,
            'message' => 'Jalur FO berhasil diperbarui',
            'data' => $foRoute
        ]);
    }

    /**
     * Delete FO point
     */
    public function deletePoint(FoPoint $foPoint)
    {
        $foPoint->delete();

        return response()->json([
            'success' => true,
            'message' => 'Titik FO berhasil dihapus'
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
            'message' => 'Jalur FO berhasil dihapus'
        ]);
    }
}
