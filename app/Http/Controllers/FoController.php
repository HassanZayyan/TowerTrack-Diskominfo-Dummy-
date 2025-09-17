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
        
        // Get FO points by area with proper data formatting
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
                    'has_images' => !empty($point->isp_image) || !empty($point->pole_image) || !empty($point->junction_box_image),
                    'area' => $point->area,
                    'status' => $point->status,
                ];
            });

        // Get FO routes by area with proper data formatting
        $foRoutes = FoRoute::where('area', $area)
            ->where('status', 'active')
            ->get()
            ->map(function ($route) {
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'color' => $route->color,
                    'total_distance' => is_numeric($route->total_distance) ? (float) $route->total_distance : 0.0,
                    'total_points' => (int) $route->total_points,
                    'description' => $route->description,
                    'path_coordinates' => $route->path_coordinates,
                    'polyline' => $this->generateRoutePolyline($route->path_coordinates),
                    'area' => $route->area,
                    'status' => $route->status,
                    'coordinates' => $this->generateRoutePolyline($route->path_coordinates),
                ];
            });

        // Calculate map bounds
        $bounds = $this->calculateMapBounds($foPoints);

        return Inertia::render('DataFo/Index', [
            'foPoints' => $foPoints,
            'foRoutes' => $foRoutes,
            'currentArea' => $area,
            'availableAreas' => ['ungaran', 'ambarawa'],
            'mapData' => [
                'points' => $foPoints,
                'routes' => $foRoutes,
                'bounds' => $bounds,
                'area' => $area,
            ]
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
        $foRoute->update(['total_distance' => $foRoute->calculateDistance()]);

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
                    'has_images' => !empty($point->isp_image) || !empty($point->pole_image) || !empty($point->junction_box_image),
                ];
            });

        // Get FO routes by area with polylines
        $foRoutes = FoRoute::where('area', $area)
            ->where('status', 'active')
            ->get()
            ->map(function ($route) {
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'color' => $route->color,
                    'total_distance' => is_numeric($route->total_distance) ? (float) $route->total_distance : 0.0,
                    'total_points' => $route->total_points,
                    'description' => $route->description,
                    'path_coordinates' => $route->path_coordinates,
                    'polyline' => $this->generateRoutePolyline($route->path_coordinates),
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
            ]
        ]);
    }

    /**
     * Get detailed route data with enhanced polyline
     */
    public function getRouteDetails(FoRoute $foRoute)
    {
        $points = $foRoute->points()
            ->orderBy('sequence_number')
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

        $enhancedPolyline = $this->generateEnhancedRoutePolyline($foRoute->path_coordinates);

        return response()->json([
            'success' => true,
            'data' => [
                'route' => [
                    'id' => $foRoute->id,
                    'name' => $foRoute->name,
                    'color' => $foRoute->color,
                    'total_distance' => $foRoute->total_distance,
                    'total_points' => $foRoute->total_points,
                    'description' => $foRoute->description,
                ],
                'points' => $points,
                'polyline' => $enhancedPolyline,
                'bounds' => $this->calculateMapBounds($points),
            ]
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
            
            // Calculate distance to determine number of intermediate points
            $distance = $this->calculateDistance(
                $start['lat'], $start['lng'],
                $end['lat'], $end['lng']
            );
            
            // More points for longer distances
            $numPoints = max(3, min(20, (int) ($distance * 10)));
            
            // Generate smooth curve between points
            $curvePoints = $this->generateCurvePoints(
                $start['lat'], $start['lng'],
                $end['lat'], $end['lng'],
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
                'lng' => $lng
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
                'lng' => $lng
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
