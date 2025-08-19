<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoRoute extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'area',
        'description',
        'path_coordinates',
        'status',
        'color',
        'total_distance',
        'properties',
    ];

    protected $casts = [
        'path_coordinates' => 'json',
        'total_distance' => 'decimal:2',
        'properties' => 'json',
    ];

    /**
     * Scope untuk filter berdasarkan area
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $area
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByArea($query, $area)
    {
        return $query->where('area', $area);
    }

    /**
     * Scope untuk filter berdasarkan status
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Calculate total distance dari koordinat jalur
     * 
     * @return float Total distance in kilometers
     */
    public function calculateDistance()
    {
        if (!$this->path_coordinates || count($this->path_coordinates) < 2) {
            return 0;
        }

        $totalDistance = 0;
        $coordinates = $this->path_coordinates;

        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $totalDistance += $this->distanceBetweenPoints(
                $coordinates[$i]['lat'],
                $coordinates[$i]['lng'],
                $coordinates[$i + 1]['lat'],
                $coordinates[$i + 1]['lng']
            );
        }

        return round($totalDistance, 2);
    }

    /**
     * Calculate distance antara dua titik menggunakan Haversine formula
     * 
     * @param float $lat1 Latitude of point 1
     * @param float $lon1 Longitude of point 1
     * @param float $lat2 Latitude of point 2
     * @param float $lon2 Longitude of point 2
     * @return float Distance in kilometers
     */
    private function distanceBetweenPoints($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Radius bumi dalam kilometer

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
