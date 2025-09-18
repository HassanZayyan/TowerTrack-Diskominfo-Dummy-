<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class FoRoute extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'area',
        'description',
        'path_coordinates',
        'status',
        'color',
        'total_distance',
        'total_points',
        'point_ids',
        'properties',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'path_coordinates' => 'array',
        'point_ids' => 'array',
        'properties' => 'array',
        'total_distance' => 'float',
        'total_points' => 'integer',
    ];

    /**
     * Boot model events.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty('name') && empty($model->slug)) {
                $model->slug = Str::slug($model->name);
            }
        });
    }

    /**
     * Get the points that belong to this route.
     */
    public function points()
    {
        if (empty($this->point_ids)) {
            return collect();
        }
        
        return FoPoint::whereIn('id', $this->point_ids)
                     ->orderBy('sequence_number')
                     ->get();
    }

    /**
     * Scope untuk filter berdasarkan area.
     */
    public function scopeByArea($query, $area)
    {
        return $query->where('area', $area);
    }

    /**
     * Scope untuk filter berdasarkan status.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Calculate total distance dari path coordinates.
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
                $coordinates[$i]['lat'] ?? $coordinates[$i]['latitude'] ?? 0,
                $coordinates[$i]['lng'] ?? $coordinates[$i]['longitude'] ?? 0,
                $coordinates[$i + 1]['lat'] ?? $coordinates[$i + 1]['latitude'] ?? 0,
                $coordinates[$i + 1]['lng'] ?? $coordinates[$i + 1]['longitude'] ?? 0
            );
        }

        return round($totalDistance, 2);
    }

    /**
     * Calculate distance antara dua titik menggunakan Haversine formula.
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

    /**
     * Update total points dan point IDs berdasarkan points yang terhubung.
     */
    public function updateTotalPoints()
    {
        $points = $this->points();
        $this->total_points = $points->count();
        $this->point_ids = $points->pluck('id')->toArray();
        $this->save();
    }

    /**
     * Generate path coordinates dari points yang terhubung.
     */
    public function generatePathFromPoints()
    {
        $points = $this->points()->orderBy('sequence_number')->get();
        
        $pathCoordinates = $points->map(function ($point) {
            return [
                'lat' => (float) $point->latitude,
                'lng' => (float) $point->longitude,
            ];
        })->toArray();

        $this->path_coordinates = $pathCoordinates;
        $this->update(['total_distance' => $this->calculateDistance()]);
    }

    /**
     * Create jalur dari array points berdasarkan route_name.
     */
    public static function createFromPoints($routeName, $area = 'ungaran')
    {
        $points = FoPoint::where('route_name', $routeName)
                         ->where('area', $area)
                         ->orderBy('sequence_number')
                         ->get();

        if ($points->isEmpty()) {
            return null;
        }

        $pathCoordinates = $points->map(function ($point) {
            return [
                'lat' => (float) $point->latitude,
                'lng' => (float) $point->longitude,
            ];
        })->toArray();

        $route = static::create([
            'name' => $routeName,
            'area' => $area,
            'description' => "Jalur FO {$routeName} - {$points->count()} titik",
            'path_coordinates' => $pathCoordinates,
            'status' => 'active',
            'color' => static::getRandomColor(),
            'total_points' => $points->count(),
            'point_ids' => $points->pluck('id')->toArray(),
        ]);

        $route->update(['total_distance' => $route->calculateDistance()]);

        // Attach points to route
        $route->points()->attach($points);

        return $route;
    }

    /**
     * Get random color untuk jalur.
     */
    private static function getRandomColor()
    {
        $colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        return $colors[array_rand($colors)];
    }
}
