<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * FO Provider Model (Master Provider)
 * 
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $default_sort_order
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\FoPoint> $foPoints
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\FoPoint> $activeFoPoints
 */
class FoProvider extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * This is now the master provider table
     *
     * @var string
     */
    protected $table = 'fo_providers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'default_sort_order',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'default_sort_order' => 'integer',
    ];

    /**
     * Get the FO points that have this provider.
     * Many-to-many relationship through pivot table
     */
    public function foPoints(): BelongsToMany
    {
        return $this->belongsToMany(FoPoint::class, 'fo_point_provider')
                    ->withPivot('is_active', 'sort_order')
                    ->withTimestamps()
                    ->orderByPivot('sort_order');
    }

    /**
     * Get active FO points (where provider is active on that point)
     */
    public function activeFoPoints(): BelongsToMany
    {
        return $this->foPoints()->wherePivot('is_active', true);
    }

    /**
     * Scope untuk filter provider aktif.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk ordering by default_sort_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('default_sort_order')->orderBy('name');
    }
}
