<?php

namespace App\Services;

use App\Models\FoPoint;
use App\Models\FoRoute;
use Illuminate\Support\Facades\Log;

/**
 * Service untuk mendeteksi sisi jalan (kiri/kanan) dari FO Point
 * berdasarkan route polyline atau neighbors
 */
class FoPointSideDetectionService
{
    /**
     * Deteksi sisi jalan untuk sebuah point berdasarkan route polyline
     * 
     * @param FoPoint $point
     * @param array|null $routePolyline Array of [lat, lng] coordinates
     * @return string 'left'|'right'|'unknown'
     */
    public function detectSideFromRoute(FoPoint $point, ?array $routePolyline = null): string
    {
        if (!$routePolyline || count($routePolyline) < 2) {
            // Try to get route polyline from route
            $route = FoRoute::where('name', $point->route_name)
                           ->where('area', $point->area)
                           ->first();
            
            if (!$route) {
                return 'unknown';
            }
            
            $routePolyline = $route->hasValidGeoJSON() 
                ? $route->getGeoJSONCoordinates()
                : ($route->path_coordinates ?? null);
            
            if (!$routePolyline || count($routePolyline) < 2) {
                return 'unknown';
            }
        }
        
        // Find nearest segment on route
        $nearestSegment = $this->findNearestSegment(
            $point->latitude,
            $point->longitude,
            $routePolyline
        );
        
        if (!$nearestSegment) {
            return 'unknown';
        }
        
        // Calculate bearing of the route segment
        $bearing = $this->calculateBearing(
            $nearestSegment['start']['lat'],
            $nearestSegment['start']['lng'],
            $nearestSegment['end']['lat'],
            $nearestSegment['end']['lng']
        );
        
        // Calculate relative position of point to route
        $side = $this->calculateRelativeSide(
            $point->latitude,
            $point->longitude,
            $nearestSegment['start']['lat'],
            $nearestSegment['start']['lng'],
            $nearestSegment['end']['lat'],
            $nearestSegment['end']['lng'],
            $bearing
        );
        
        return $side;
    }
    
    /**
     * Deteksi sisi jalan berdasarkan neighbors (point sebelum/sesudah)
     * 
     * @param FoPoint $point
     * @return string 'left'|'right'|'unknown'
     */
    public function detectSideFromNeighbors(FoPoint $point): string
    {
        $route = FoRoute::where('name', $point->route_name)
                       ->where('area', $point->area)
                       ->first();
        
        if (!$route) {
            return 'unknown';
        }
        
        // Get previous and next points
        $prevPoint = FoPoint::where('route_name', $point->route_name)
                           ->where('area', $point->area)
                           ->where('sequence_number', '<', $point->sequence_number)
                           ->orderBy('sequence_number', 'desc')
                           ->first();
        
        $nextPoint = FoPoint::where('route_name', $point->route_name)
                           ->where('area', $point->area)
                           ->where('sequence_number', '>', $point->sequence_number)
                           ->orderBy('sequence_number', 'asc')
                           ->first();
        
        // Use next point if available, otherwise previous
        $referencePoint = $nextPoint ?? $prevPoint;
        
        if (!$referencePoint) {
            return 'unknown';
        }
        
        // Calculate bearing from reference point to current point
        $bearing = $this->calculateBearing(
            $referencePoint->latitude,
            $referencePoint->longitude,
            $point->latitude,
            $point->longitude
        );
        
        // This is a simplified approach - in practice, you might need
        // more sophisticated logic based on actual road geometry
        // For now, return unknown as this method is less reliable
        return 'unknown';
    }
    
    /**
     * Find nearest segment on route polyline to the point
     * 
     * @param float $pointLat
     * @param float $pointLng
     * @param array $polyline Array of [lat, lng] or [lng, lat] coordinates
     * @return array|null ['start' => [...], 'end' => [...], 'distance' => float]
     */
    private function findNearestSegment(float $pointLat, float $pointLng, array $polyline): ?array
    {
        $minDistance = PHP_FLOAT_MAX;
        $nearestSegment = null;
        
        for ($i = 0; $i < count($polyline) - 1; $i++) {
            // Handle both coordinate formats
            $start = $this->normalizeCoordinate($polyline[$i]);
            $end = $this->normalizeCoordinate($polyline[$i + 1]);
            
            $distance = $this->distanceToSegment(
                $pointLat,
                $pointLng,
                $start['lat'],
                $start['lng'],
                $end['lat'],
                $end['lng']
            );
            
            if ($distance < $minDistance) {
                $minDistance = $distance;
                $nearestSegment = [
                    'start' => $start,
                    'end' => $end,
                    'distance' => $distance
                ];
            }
        }
        
        return $nearestSegment;
    }
    
    /**
     * Normalize coordinate format to [lat, lng]
     * Handles both [lat, lng] and [lng, lat] formats
     */
    private function normalizeCoordinate($coord): array
    {
        if (is_array($coord)) {
            // Check if it's [lng, lat] (GeoJSON format) or [lat, lng]
            // GeoJSON typically has longitude first
            if (count($coord) >= 2) {
                // If longitude is > 90 or < -90, it's likely [lng, lat]
                if (abs($coord[0]) > 90) {
                    return ['lat' => $coord[1], 'lng' => $coord[0]];
                } else {
                    return ['lat' => $coord[0], 'lng' => $coord[1]];
                }
            }
        }
        
        // Fallback
        return ['lat' => 0, 'lng' => 0];
    }
    
    /**
     * Calculate distance from point to line segment
     * Using perpendicular distance formula
     */
    private function distanceToSegment(
        float $px, float $py,
        float $x1, float $y1,
        float $x2, float $y2
    ): float {
        // Convert to meters for calculation
        $A = $px - $x1;
        $B = $py - $y1;
        $C = $x2 - $x1;
        $D = $y2 - $y1;
        
        $dot = $A * $C + $B * $D;
        $lenSq = $C * $C + $D * $D;
        
        if ($lenSq == 0) {
            // Segment is a point
            return $this->haversineDistance($px, $py, $x1, $y1);
        }
        
        $param = $dot / $lenSq;
        
        if ($param < 0) {
            $xx = $x1;
            $yy = $y1;
        } elseif ($param > 1) {
            $xx = $x2;
            $yy = $y2;
        } else {
            $xx = $x1 + $param * $C;
            $yy = $y1 + $param * $D;
        }
        
        return $this->haversineDistance($px, $py, $xx, $yy);
    }
    
    /**
     * Calculate bearing between two points
     * Returns bearing in degrees (0-360)
     */
    private function calculateBearing(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLon = deg2rad($lon2 - $lon1);
        
        $y = sin($deltaLon) * cos($lat2Rad);
        $x = cos($lat1Rad) * sin($lat2Rad) - 
             sin($lat1Rad) * cos($lat2Rad) * cos($deltaLon);
        
        $bearing = atan2($y, $x);
        $bearing = rad2deg($bearing);
        $bearing = fmod($bearing + 360, 360);
        
        return $bearing;
    }
    
    /**
     * Calculate which side of the route the point is on
     * Using cross product to determine left/right
     * 
     * @return string 'left'|'right'|'unknown'
     */
    private function calculateRelativeSide(
        float $pointLat, float $pointLng,
        float $segStartLat, float $segStartLng,
        float $segEndLat, float $segEndLng,
        float $bearing
    ): string {
        // Vector from segment start to end
        $dx1 = $segEndLng - $segStartLng;
        $dy1 = $segEndLat - $segStartLat;
        
        // Vector from segment start to point
        $dx2 = $pointLng - $segStartLng;
        $dy2 = $pointLat - $segStartLat;
        
        // Cross product (in lat/lng space, approximate)
        // For small distances, this approximation works
        $crossProduct = $dx1 * $dy2 - $dy1 * $dx2;
        
        // Adjust for latitude (longitude distance varies with latitude)
        $latAdjustment = cos(deg2rad(($segStartLat + $segEndLat) / 2));
        $crossProduct *= $latAdjustment;
        
        // Positive cross product = point is to the left (when facing direction of travel)
        // Negative cross product = point is to the right
        if (abs($crossProduct) < 0.0001) {
            // Point is very close to the line, consider unknown
            return 'unknown';
        }
        
        return $crossProduct > 0 ? 'left' : 'right';
    }
    
    /**
     * Haversine distance calculation
     */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }
    
    /**
     * Bulk detect side for multiple points
     * 
     * @param array $pointIds
     * @param bool $forceUpdate Force update even if already set
     * @return array ['updated' => int, 'failed' => int]
     */
    public function bulkDetect(array $pointIds, bool $forceUpdate = false): array
    {
        $updated = 0;
        $failed = 0;
        
        foreach ($pointIds as $pointId) {
            try {
                $point = FoPoint::find($pointId);
                
                if (!$point) {
                    $failed++;
                    continue;
                }
                
                // Skip if already set and not forcing update
                if (!$forceUpdate && $point->side_of_road && $point->side_of_road !== 'unknown') {
                    continue;
                }
                
                $side = $this->detectSideFromRoute($point);
                
                $point->side_of_road = $side;
                $point->save();
                
                $updated++;
            } catch (\Exception $e) {
                Log::error("Failed to detect side for point {$pointId}: " . $e->getMessage());
                $failed++;
            }
        }
        
        return [
            'updated' => $updated,
            'failed' => $failed
        ];
    }
}

