<?php

namespace App\Services;

use App\Models\FoRoute;
use App\Models\FoPoint;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class FoRouteGenerationService
{
    /**
     * OpenRouteService API Key
     * Register at https://openrouteservice.org/ untuk mendapatkan API key gratis
     */
    private string $apiKey;
    
    /**
     * Base URL untuk OpenRouteService API
     */
    private string $baseUrl = 'https://api.openrouteservice.org';
    
    /**
     * Default routing profile
     */
    private string $defaultProfile = 'driving-car';
    
    public function __construct()
    {
        $this->apiKey = config('services.openrouteservice.api_key', '');
        $this->baseUrl = config('services.openrouteservice.base_url', 'https://api.openrouteservice.org');
        
        if (empty($this->apiKey)) {
            Log::info('OpenRouteService API key not configured, will use fallback route generation');
        } else {
            Log::info('OpenRouteService configured and ready');
        }
    }
    
    /**
     * Validate configuration
     */
    public function validateConfiguration(): array
    {
        $issues = [];
        
        if (empty($this->apiKey)) {
            $issues[] = 'OpenRouteService API key not configured';
        }
        
        if (empty($this->baseUrl)) {
            $issues[] = 'OpenRouteService base URL not configured';
        }
        
        return $issues;
    }
    
    /**
     * Check if service is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->baseUrl);
    }
    
    /**
     * Test API connectivity
     */
    public function testApiConnectivity(): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }
        
        try {
            // Test with a simple request to check API key validity
            $testCoordinates = [[110.408685, -7.121637], [110.409685, -7.122637]];
            
            $response = Http::timeout(10)
                ->withOptions([
                    'verify' => false, // Disable SSL verification for development
                ])
                ->withHeaders([
                    'Authorization' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/v2/directions/driving-car/geojson", [
                    'coordinates' => $testCoordinates,
                    'format' => 'geojson',
                    'instructions' => false,
                ]);
                
            $status = $response->status();
            Log::info("API connectivity test response: {$status}", [
                'status' => $status,
                'body' => $response->body()
            ]);
                
            return $status === 200; // Only 200 is considered successful
        } catch (Exception $e) {
            Log::warning('OpenRouteService API connectivity test failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Generate GeoJSON route dari FO points
     */
    public function generateRouteFromPoints(FoRoute $route): bool
    {
        $startTime = microtime(true);
        
        try {
            Log::info("Starting route generation for: {$route->name} (Area: {$route->area})");
            
            // Get points untuk route ini
            $points = FoPoint::where('route_name', $route->name)
                            ->where('area', $route->area)
                            ->orderBy('sequence_number')
                            ->get();
            
            if ($points->count() < 2) {
                Log::warning("Route {$route->name} tidak memiliki cukup points untuk generate routing", [
                    'route_id' => $route->id,
                    'points_count' => $points->count()
                ]);
                return false;
            }
            
            // Convert points ke koordinat
            $coordinates = $points->map(function ($point) {
                return [$point->longitude, $point->latitude]; // GeoJSON format: [lng, lat]
            })->toArray();
            
            // Validate coordinates
            foreach ($coordinates as $i => $coord) {
                if (!is_numeric($coord[0]) || !is_numeric($coord[1]) || 
                    abs($coord[0]) > 180 || abs($coord[1]) > 90) {
                    Log::error("Invalid coordinates in route {$route->name} at point {$i}", [
                        'coordinate' => $coord,
                        'route_id' => $route->id
                    ]);
                    return false;
                }
            }
            
            Log::debug("Generating route with {$points->count()} points", [
                'route_name' => $route->name,
                'coordinates_count' => count($coordinates)
            ]);
            
            // Generate route menggunakan routing service
            $geojson = $this->getRouteFromCoordinates($coordinates, $route->getRoutingParameters());
            
            if (!$geojson) {
                Log::error("Failed to generate route for {$route->name}", [
                    'route_id' => $route->id,
                    'points_count' => $points->count()
                ]);
                return false;
            }
            
            // Calculate metrics
            $actualDistance = $this->calculateDistanceFromGeoJSON($geojson);
            $estimatedDuration = $this->calculateDurationFromGeoJSON($geojson);
            $routingService = $this->isConfigured() ? 'openrouteservice' : 'fallback';
            
            // Update route dengan GeoJSON data
            $route->update([
                'geojson' => $geojson,
                'geojson_generated_at' => now(),
                'routing_service' => $routingService,
                'actual_distance' => $actualDistance,
                'estimated_duration' => $estimatedDuration,
            ]);
            
            $executionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            Log::info("Successfully generated route for {$route->name}", [
                'route_id' => $route->id,
                'routing_service' => $routingService,
                'actual_distance' => $actualDistance,
                'estimated_duration' => $estimatedDuration,
                'execution_time_ms' => $executionTime,
                'coordinates_generated' => count($geojson['coordinates'] ?? [])
            ]);
            
            return true;
            
        } catch (Exception $e) {
            Log::error("Error generating route for {$route->name}: " . $e->getMessage(), [
                'route_id' => $route->id,
                'exception' => $e,
                'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2)
            ]);
            return false;
        }
    }
    
    /**
     * Get route dari koordinat menggunakan OpenRouteService
     */
    private function getRouteFromCoordinates(array $coordinates, array $parameters = []): ?array
    {
        if (empty($this->apiKey)) {
            Log::info('API key not available, using fallback route generation');
            return $this->generateFallbackRoute($coordinates);
        }
        
        try {
            $profile = $this->mapProfileToORS($parameters['profile'] ?? 'driving');
            
            $requestData = [
                'coordinates' => $coordinates,
                'format' => 'geojson',
                'instructions' => false,
                'geometry_simplify' => false, // Disable simplification for more detailed routes
                'continue_straight' => false,
                'radiuses' => array_fill(0, count($coordinates), 1000), // Allow 1km radius for snapping to roads
                'bearings' => array_fill(0, count($coordinates), [-1, -1]), // No bearing restrictions
            ];
            
            // Add avoid options jika diperlukan
            if (!empty($parameters['avoid_highways']) || !empty($parameters['avoid_tolls'])) {
                $avoid = [];
                if ($parameters['avoid_highways']) $avoid[] = 'highways';
                if ($parameters['avoid_tolls']) $avoid[] = 'tollways';
                
                $requestData['options'] = ['avoid_features' => $avoid];
            }
            
            Log::info('Making OpenRouteService API call', [
                'profile' => $profile,
                'coordinates_count' => count($coordinates),
                'endpoint' => "{$this->baseUrl}/v2/directions/{$profile}/geojson"
            ]);
            
            $response = Http::timeout(30)
                ->withOptions([
                    'verify' => false, // Disable SSL verification for development
                ])
                ->withHeaders([
                    'Authorization' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/v2/directions/{$profile}/geojson", $requestData);
            
            $status = $response->status();
            
            if ($status === 200) {
                $data = $response->json();
                
                if (isset($data['features'][0]['geometry'])) {
                    $geometry = $data['features'][0]['geometry'];
                    Log::info('OpenRouteService API call successful', [
                        'coordinates_returned' => count($geometry['coordinates'] ?? []),
                        'geometry_type' => $geometry['type'] ?? 'unknown'
                    ]);
                    return $geometry;
                } else {
                    Log::warning('OpenRouteService API returned invalid response structure', [
                        'response_keys' => array_keys($data ?? []),
                        'response' => $data
                    ]);
                }
            } else {
                Log::warning('OpenRouteService API call failed', [
                    'status' => $status,
                    'body' => $response->body(),
                    'headers' => $response->headers()
                ]);
            }
            
            return $this->generateFallbackRoute($coordinates);
            
        } catch (Exception $e) {
            Log::error('OpenRouteService API error: ' . $e->getMessage(), [
                'exception' => $e,
                'coordinates_count' => count($coordinates)
            ]);
            return $this->generateFallbackRoute($coordinates);
        }
    }
    
    /**
     * Generate fallback route (straight lines) jika API tidak tersedia
     */
    private function generateFallbackRoute(array $coordinates): array
    {
        // Generate route dengan interpolasi sederhana antara points
        $interpolatedCoords = [];
        
        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $start = $coordinates[$i];
            $end = $coordinates[$i + 1];
            
            // Add start point
            $interpolatedCoords[] = $start;
            
            // Add interpolated points (simple linear interpolation)
            $steps = max(5, intval($this->haversineDistance($start[1], $start[0], $end[1], $end[0]) * 10));
            
            for ($step = 1; $step < $steps; $step++) {
                $ratio = $step / $steps;
                $interpolatedCoords[] = [
                    $start[0] + ($end[0] - $start[0]) * $ratio,
                    $start[1] + ($end[1] - $start[1]) * $ratio,
                ];
            }
        }
        
        // Add final point
        $interpolatedCoords[] = end($coordinates);
        
        return [
            'type' => 'LineString',
            'coordinates' => $interpolatedCoords,
        ];
    }
    
    /**
     * Map internal profile names to OpenRouteService profiles
     * For fiber optic routes, we use foot-walking as it follows roads more closely
     * and allows access to areas where cars cannot go
     */
    private function mapProfileToORS(string $profile): string
    {
        $mapping = [
            'driving' => 'foot-walking', // Changed from driving-car to foot-walking for better road following
            'walking' => 'foot-walking',
            'cycling' => 'cycling-regular',
            'fiber_optic' => 'foot-walking', // Dedicated profile for fiber optic routes
        ];
        
        return $mapping[$profile] ?? 'foot-walking'; // Default to foot-walking instead of driving-car
    }
    
    /**
     * Calculate distance dari GeoJSON
     */
    private function calculateDistanceFromGeoJSON(array $geojson): float
    {
        if (!isset($geojson['coordinates']) || !is_array($geojson['coordinates'])) {
            return 0;
        }
        
        $coordinates = $geojson['coordinates'];
        $totalDistance = 0;
        
        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $totalDistance += $this->haversineDistance(
                $coordinates[$i][1], // latitude
                $coordinates[$i][0], // longitude
                $coordinates[$i + 1][1], // latitude
                $coordinates[$i + 1][0]  // longitude
            );
        }
        
        return round($totalDistance, 2);
    }
    
    /**
     * Calculate estimated duration (simple approximation)
     */
    private function calculateDurationFromGeoJSON(array $geojson): int
    {
        $distance = $this->calculateDistanceFromGeoJSON($geojson);
        
        // Estimate duration berdasarkan jarak dan profile
        // Asumsi kecepatan rata-rata: 30 km/h untuk driving, 5 km/h untuk walking
        $averageSpeed = 30; // km/h
        $durationHours = $distance / $averageSpeed;
        
        return intval($durationHours * 3600); // Convert to seconds
    }
    
    /**
     * Haversine distance calculation
     */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // kilometers
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }
    
    /**
     * Batch generate routes untuk semua routes yang memerlukan regeneration
     */
    public function regenerateAllRoutes(?string $area = null): array
    {
        $query = FoRoute::query();
        
        if ($area) {
            $query->where('area', $area);
        }
        
        $routes = $query->get();
        $results = [
            'success' => 0,
            'failed' => 0,
            'skipped' => 0,
            'total' => $routes->count(),
        ];
        
        foreach ($routes as $route) {
            if (!$route->needsGeoJSONRegeneration()) {
                $results['skipped']++;
                continue;
            }
            
            if ($this->generateRouteFromPoints($route)) {
                $results['success']++;
            } else {
                $results['failed']++;
            }
            
            // Add small delay untuk menghindari rate limiting
            usleep(100000); // 0.1 second
        }
        
        return $results;
    }
}
