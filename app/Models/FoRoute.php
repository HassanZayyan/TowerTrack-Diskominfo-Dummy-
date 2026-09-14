<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\FoProvider;

/**
 * @property int $id
 * @property string $name
 * @property string|null $slug
 * @property string $area
 * @property string|null $description
 * @property array|null $path_coordinates
 * @property array|null $geojson
 * @property string|null $routing_profile
 * @property bool|null $avoid_highways
 * @property bool|null $avoid_tolls
 * @property array|null $waypoints
 * @property \Illuminate\Support\Carbon|null $geojson_generated_at
 * @property string|null $routing_service
 * @property float|null $actual_distance
 * @property int|null $estimated_duration
 * @property string $status
 * @property string|null $color
 * @property float|null $total_distance
 * @property int|null $total_points
 * @property array|null $point_ids
 * @property array|null $properties
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
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
        'geojson',
        'routing_profile',
        'avoid_highways',
        'avoid_tolls',
        'waypoints',
        'geojson_generated_at',
        'routing_service',
        'actual_distance',
        'estimated_duration',
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
        'geojson' => 'array',
        'waypoints' => 'array',
        'point_ids' => 'array',
        'properties' => 'array',
        'total_distance' => 'float',
        'actual_distance' => 'float',
        'estimated_duration' => 'integer',
        'total_points' => 'integer',
        'avoid_highways' => 'boolean',
        'avoid_tolls' => 'boolean',
        'geojson_generated_at' => 'datetime',
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
     * Uses route_name and area as primary relationship.
     * This is a HasMany relationship for query builder compatibility.
     * Note: For whereHas queries, area matching is handled in the closure.
     */
    public function points(): HasMany
    {
        return $this->hasMany(FoPoint::class, 'route_name', 'name')
                    ->orderBy('sequence_number');
    }

    /**
     * Get points collection (for backward compatibility).
     * Uses route_name and area as primary relationship, with point_ids as fallback.
     */
    public function getPoints()
    {
        // Primary: Get points by route_name and area (more reliable)
        $points = FoPoint::where('route_name', $this->name)
                        ->where('area', $this->area)
                        ->orderBy('sequence_number')
                        ->get();
        
        // Fallback: If no points found and point_ids exists, use point_ids
        if ($points->isEmpty() && !empty($this->point_ids)) {
            $points = FoPoint::whereIn('id', $this->point_ids)
                            ->orderBy('sequence_number')
                            ->get();
        }
        
        return $points;
    }

    /**
     * Get providers through points in this route.
     * Returns unique master providers that are associated with any point in this route.
     */
    public function providers()
    {
        $pointIds = $this->getPoints()->pluck('id')->toArray();
        
        if (empty($pointIds)) {
            return collect();
        }
        
        // Query master providers through pivot table using whereExists
        return FoProvider::whereExists(function($query) use ($pointIds) {
                $query->select(DB::raw(1))
                    ->from('fo_point_provider')
                    ->whereColumn('fo_point_provider.fo_provider_id', 'fo_providers.id')
                    ->whereIn('fo_point_provider.fo_point_id', $pointIds)
                    ->where('fo_point_provider.is_active', true);
            })
            ->active()
            ->orderBy('default_sort_order')
            ->orderBy('name')
            ->distinct()
            ->get();
    }

    /**
     * Legacy method for backward compatibility (deprecated).
     * @deprecated Use providers() instead
     */
    public function owners()
    {
        return $this->providers();
    }

    /**
     * Check if route has any providers.
     */
    public function hasProviders(): bool
    {
        return $this->providers()->isNotEmpty();
    }

    /**
     * Legacy method for backward compatibility (deprecated).
     * @deprecated Use hasProviders() instead
     */
    public function hasOwners(): bool
    {
        return $this->hasProviders();
    }

    /**
     * Scope untuk filter routes yang memiliki providers.
     */
    public function scopeHasProviders($query)
    {
        return $query->whereHas('points', function($q) {
            // Ensure area matches between route and points
            $q->whereColumn('fo_points.area', 'fo_routes.area')
              ->whereExists(function($subQuery) {
                  // Query pivot table directly to check if point has active providers
                  $subQuery->select(DB::raw(1))
                      ->from('fo_point_provider')
                      ->whereColumn('fo_point_provider.fo_point_id', 'fo_points.id')
                      ->where('fo_point_provider.is_active', true);
              });
        });
    }

    /**
     * Legacy scope for backward compatibility (deprecated).
     * @deprecated Use hasProviders() instead
     */
    public function scopeHasOwners($query)
    {
        return $this->scopeHasProviders($query);
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
        // Count points by route_name and area instead of point_ids
        $pointsCount = FoPoint::where('route_name', $this->name)
                              ->where('area', $this->area)
                              ->count();
        
        $this->total_points = $pointsCount;
        $this->save();
        
        return $this;
    }

    /**
     * Generate path coordinates dari points yang terhubung.
     */
    public function generatePathFromPoints()
    {
        $points = $this->points()->where('fo_points.area', $this->area)->orderBy('sequence_number')->get();
        
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

        // Note: Points are linked via route_name and area, not through attach()
        // This line is kept for backward compatibility but doesn't do anything
        // as there's no pivot table between routes and points

        return $route;
    }

    /**
     * Get random color untuk jalur.
     *
     * The pool is the categorical series from resources/js/lib/map-palette.ts,
     * which is the same five colours the map draws routes with. It used to be
     * six stock Tailwind hues led by #3B82F6, none of which belonged to this
     * palette and one of which is the blue the map rules out entirely.
     *
     * Nothing calls this today — it is kept because route creation is the
     * obvious place for it to come back, and a wrong palette waiting to be
     * picked up is worse than no palette.
     */
    private static function getRandomColor()
    {
        $colors = ['#982700', '#00888E', '#6B005C', '#5F9D00', '#C06DFF'];

        return $colors[array_rand($colors)];
    }

    /**
     * Check apakah route memiliki GeoJSON yang valid.
     */
    public function hasValidGeoJSON(): bool
    {
        return !empty($this->geojson) && 
               isset($this->geojson['type']) && 
               $this->geojson['type'] === 'LineString' &&
               isset($this->geojson['coordinates']) &&
               is_array($this->geojson['coordinates']) &&
               count($this->geojson['coordinates']) >= 2;
    }

    /**
     * Get koordinat dari GeoJSON untuk rendering map.
     */
    public function getGeoJSONCoordinates(): array
    {
        if (!$this->hasValidGeoJSON()) {
            return [];
        }

        // GeoJSON format: [longitude, latitude]
        // Leaflet format: [latitude, longitude]
        return array_map(function ($coord) {
            return [$coord[1], $coord[0]]; // Swap lng,lat to lat,lng
        }, $this->geojson['coordinates']);
    }

    /**
     * Get simplified coordinates untuk preview atau performance.
     */
    public function getSimplifiedCoordinates(int $maxPoints = 100): array
    {
        $coordinates = $this->getGeoJSONCoordinates();
        
        if (count($coordinates) <= $maxPoints) {
            return $coordinates;
        }

        // Simple decimation algorithm
        $step = ceil(count($coordinates) / $maxPoints);
        $simplified = [];
        
        for ($i = 0; $i < count($coordinates); $i += $step) {
            $simplified[] = $coordinates[$i];
        }
        
        // Always include the last point
        if (end($simplified) !== end($coordinates)) {
            $simplified[] = end($coordinates);
        }
        
        return $simplified;
    }

    /**
     * Calculate distance dari GeoJSON coordinates.
     */
    public function calculateGeoJSONDistance(): float
    {
        if (!$this->hasValidGeoJSON()) {
            return 0;
        }

        $coordinates = $this->geojson['coordinates'];
        $totalDistance = 0;

        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $totalDistance += $this->distanceBetweenPoints(
                $coordinates[$i][1], // latitude
                $coordinates[$i][0], // longitude
                $coordinates[$i + 1][1], // latitude
                $coordinates[$i + 1][0]  // longitude
            );
        }

        return round($totalDistance, 2);
    }

    /**
     * Check apakah GeoJSON perlu di-generate ulang.
     */
    public function needsGeoJSONRegeneration(): bool
    {
        if (!$this->hasValidGeoJSON()) {
            return true;
        }

        // Check if points have been updated since GeoJSON generation
        if ($this->geojson_generated_at && $this->updated_at > $this->geojson_generated_at) {
            return true;
        }

        return false;
    }

    /**
     * Get routing parameters untuk API calls.
     * Default to fiber_optic profile for better road following
     */
    public function getRoutingParameters(): array
    {
        return [
            'profile' => $this->routing_profile ?? 'fiber_optic',
            // Prefer not to avoid highways/tolls by default so routes are more direct.
            'avoid_highways' => $this->avoid_highways ?? false,
            'avoid_tolls' => $this->avoid_tolls ?? false,
            'waypoints' => $this->waypoints ?? [],
        ];
    }
}
