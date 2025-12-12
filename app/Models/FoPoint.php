<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Models\FoProvider;

/**
 * FO Point Model
 * 
 * @property int $id
 * @property int|null $sequence_number
 * @property string $name
 * @property float $latitude
 * @property float $longitude
 * @property string|null $original_coordinates
 * @property string|null $route_name
 * @property string $area
 * @property string|null $description
 * @property string $type
 * @property string $status
 * @property string|null $side_of_road
 * @property string|null $isp_image
 * @property string|null $pole_image
 * @property string|null $junction_box_image
 * @property array|null $properties
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read string $side_of_road_label
 * @property-read string|null $isp_image_url
 * @property-read string|null $pole_image_url
 * @property-read string|null $junction_box_image_url
 * @property-read \Illuminate\Database\Eloquent\Collection<int, FoProvider> $providers
 * @property-read \Illuminate\Database\Eloquent\Collection<int, FoProvider> $activeProviders
 */
class FoPoint extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sequence_number',
        'name',
        'latitude',
        'longitude',
        'original_coordinates',
        'route_name',
        'area',
        'description',
        'type',
        'status',
        'side_of_road',
        'isp_image',
        'pole_image',
        'junction_box_image',
        'properties',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'properties' => 'array',
        'sequence_number' => 'integer',
    ];

    /**
     * Get label for side of road (for display).
     */
    public function getSideOfRoadLabelAttribute(): string
    {
        return match($this->side_of_road) {
            'left' => 'Kiri',
            'right' => 'Kanan',
            'unknown' => 'Belum Diketahui',
            default => 'Belum Diketahui'
        };
    }

    /**
     * Get the routes that include this point.
     */
    public function routes()
    {
        return FoRoute::whereJsonContains('point_ids', $this->id)->get();
    }

    /**
     * Many-to-many relationship with providers (master providers).
     * One point can have multiple providers, one provider can be on multiple points.
     */
    public function providers(): BelongsToMany
    {
        return $this->belongsToMany(FoProvider::class, 'fo_point_provider')
                    ->withPivot('is_active', 'sort_order')
                    ->withTimestamps()
                    ->orderByPivot('sort_order');
    }

    /**
     * Get active providers for this point (where pivot is_active = true).
     */
    public function activeProviders(): BelongsToMany
    {
        return $this->providers()->wherePivot('is_active', true);
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
     * Polymorphic relationship with reports
     */
    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    /**
     * Polymorphic relationship with feedbacks
     */
    public function feedbacks(): MorphMany
    {
        return $this->morphMany(Feedback::class, 'feedbackable');
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
     * Scope untuk filter berdasarkan route name.
     */
    public function scopeByRoute($query, $routeName)
    {
        return $query->where('route_name', $routeName);
    }

    /**
     * Get full URL path untuk gambar ISP.
     */
    public function getIspImageUrlAttribute()
    {
        if (empty($this->isp_image)) {
            return null;
        }

        $value = trim((string) $this->isp_image);
        
        // Handle "-" as non-existent image
        if ($value === '-' || $value === '') {
            return null;
        }
        
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return asset('images/foto jalur FO/' . ltrim($value, '/'));
    }

    /**
     * Get full URL path untuk gambar tiang.
     */
    public function getPoleImageUrlAttribute()
    {
        if (empty($this->pole_image)) {
            return null;
        }

        $value = trim((string) $this->pole_image);
        
        // Handle "-" as non-existent image
        if ($value === '-' || $value === '') {
            return null;
        }
        
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return asset('images/foto jalur FO/' . ltrim($value, '/'));
    }

    /**
     * Get full URL path untuk gambar junction box.
     */
    public function getJunctionBoxImageUrlAttribute()
    {
        if (empty($this->junction_box_image)) {
            return null;
        }

        $value = trim((string) $this->junction_box_image);
        
        // Handle "-" as non-existent image
        if ($value === '-' || $value === '') {
            return null;
        }
        
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return asset('images/foto jalur FO/' . ltrim($value, '/'));
    }

    /**
     * Parse koordinat dari format CSV.
     */
    public static function parseCoordinates($coordinateString)
    {
        if (empty($coordinateString)) {
            return [null, null];
        }

        // Format: "-7.121637,110.408685"
        $coords = explode(',', trim($coordinateString, '"'));
        
        if (count($coords) === 2) {
            return [
                'latitude' => (float) trim($coords[0]),
                'longitude' => (float) trim($coords[1])
            ];
        }

        return [null, null];
    }
}
