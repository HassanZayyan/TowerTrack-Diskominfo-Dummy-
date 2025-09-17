<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
     * Get the routes that include this point.
     */
    public function routes(): BelongsToMany
    {
        return $this->belongsToMany(FoRoute::class, 'fo_route_points')
                    ->withTimestamps();
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
