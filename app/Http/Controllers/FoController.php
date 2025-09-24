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
                // Use GeoJSON coordinates if available, otherwise fallback to path_coordinates
                $polyline = $route->hasValidGeoJSON() 
                    ? $route->getGeoJSONCoordinates()
                    : $this->generateRoutePolyline($route->path_coordinates);
                
                return [
                    'id' => $route->id,
                    'name' => $route->name,
                    'color' => $route->color,
                    'total_distance' => is_numeric($route->actual_distance) ? (float) $route->actual_distance : 
                                        (is_numeric($route->total_distance) ? (float) $route->total_distance : 0.0),
                    'total_points' => (int) $route->total_points,
                    'description' => $route->description,
                    'path_coordinates' => $route->path_coordinates,
                    'geojson' => $route->geojson,
                    'has_geojson' => $route->hasValidGeoJSON(),
                    'routing_service' => $route->routing_service,
                    'polyline' => $polyline,
                    'area' => $route->area,
                    'status' => $route->status,
                    'coordinates' => $polyline, // For backwards compatibility
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
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'area' => 'required|in:ungaran,ambarawa',
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
                'data' => $foPoint->fresh()
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui titik FO: ' . $e->getMessage()
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
                'area' => 'required|in:ungaran,ambarawa',
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
                    'total_points' => $points->count()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Jalur FO berhasil diperbarui',
                'data' => $foRoute->fresh()
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui jalur FO: ' . $e->getMessage()
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
                // Use GeoJSON coordinates if available, otherwise fallback to path_coordinates
                $polyline = $route->hasValidGeoJSON() 
                    ? $route->getGeoJSONCoordinates()
                    : $this->generateRoutePolyline($route->path_coordinates);
                
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
     * Get details for FO point or route
     */
    public function getDetails(Request $request, $type, $id)
    {
        try {
            if ($type === 'point') {
                $point = FoPoint::findOrFail($id);
                
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

                return response()->json([
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
                            'has_images' => !empty($point->isp_image) || !empty($point->pole_image) || !empty($point->junction_box_image),
                        ],
                        'related_routes' => $relatedRoutes,
                    ]
                ]);
            } elseif ($type === 'route') {
                $route = FoRoute::findOrFail($id);
                
                $points = $route->points()
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

                return response()->json([
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
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid type. Must be "point" or "route"'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data not found or error occurred: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get detailed route data with enhanced polyline
     */
    public function getRouteDetails(FoRoute $foRoute)
    {
        $points = $foRoute->points()
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
            ]
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
            if (!empty($validated)) {
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
                    ]
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
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate GeoJSON routes for all routes in area
     */
    public function generateAllGeoJSONRoutes(Request $request)
    {
        try {
            $validated = $request->validate([
                'area' => 'nullable|string|in:ungaran,ambarawa',
            ]);

            $routeService = app(\App\Services\FoRouteGenerationService::class);
            $results = $routeService->regenerateAllRoutes($validated['area'] ?? null);

            return response()->json([
                'success' => true,
                'message' => "Berhasil generate {$results['success']} jalur dari {$results['total']} total jalur",
                ...$results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
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
