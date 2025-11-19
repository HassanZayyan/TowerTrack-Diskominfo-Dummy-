<?php

namespace App\Traits;

use App\Models\FoPoint;
use App\Models\FoRoute;

/**
 * Trait untuk update route statistics yang reusable
 * DRY: Menghilangkan duplikasi logika update route statistics
 */
trait HasFoRouteStatistics
{
    /**
     * Update route statistics based on its points
     * DRY: Reusable method untuk update total_points, path_coordinates, dan total_distance
     * 
     * @param int $routeId Route ID to update
     * @return void
     */
    protected function updateFoRouteStatistics(int $routeId): void
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

    /**
     * Calculate distance between two coordinates using Haversine formula
     * DRY: Reusable method untuk menghitung jarak antara dua titik
     * 
     * @param float $lat1 Latitude of first point
     * @param float $lng1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lng2 Longitude of second point
     * @return float Distance in kilometers
     */
    protected function calculateHaversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
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
     * Recalculate route distance manually (for cases where model method is not available)
     * DRY: Alternative method jika calculateDistance dari model tidak tersedia
     * 
     * @param array $coordinates Array of coordinates [['lat' => float, 'lng' => float], ...]
     * @return float Total distance in kilometers
     */
    protected function calculateRouteDistance(array $coordinates): float
    {
        if (count($coordinates) < 2) {
            return 0.0;
        }

        $totalDistance = 0.0;
        $earthRadius = 6371; // Earth's radius in kilometers

        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $lat1 = (float) ($coordinates[$i]['lat'] ?? $coordinates[$i]['latitude'] ?? 0);
            $lng1 = (float) ($coordinates[$i]['lng'] ?? $coordinates[$i]['longitude'] ?? 0);
            $lat2 = (float) ($coordinates[$i + 1]['lat'] ?? $coordinates[$i + 1]['latitude'] ?? 0);
            $lng2 = (float) ($coordinates[$i + 1]['lng'] ?? $coordinates[$i + 1]['longitude'] ?? 0);

            $totalDistance += $this->calculateHaversineDistance($lat1, $lng1, $lat2, $lng2);
        }

        return round($totalDistance, 2);
    }
}

