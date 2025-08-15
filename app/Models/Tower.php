<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tower extends Model
{
    use HasFactory;

    protected $table = 'towers';

    protected $fillable = [
        'site_id',
        'site_sap',
        'site_name',
        'longitude',
        'latitude',
        'tinggi_menara',
        'tinggi_bangunan',
        'jumlah_pengguna',
        'jumlah_kaki',
        'alamat_menara',
        'tower_type',
        'site_type',
        'no_ijin',
        'tanggal_ijin',
        'berlaku_hingga',
        'jenis_ijin',
        'status_ijin',
        'prs',
        'prs_id',
    ];

    protected $casts = [
        'tanggal_ijin' => 'date',
        'berlaku_hingga' => 'date',
        'longitude' => 'decimal:8',
        'latitude' => 'decimal:8',
        'tinggi_menara' => 'float',
        'tinggi_bangunan' => 'float',
    ];

    // We're not using appends to avoid issues with special characters in attribute names
    // protected $appends = ['owner', 'alamat_owner', 'id_no_urut'];

    /**
     * Many-to-many relationship with owners
     */
    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(Owner::class, 'tower_owners');
    }

    /**
     * Get the primary owner (first owner)
     */
    public function primaryOwner()
    {
        return $this->owners()->first();
    }

    /**
     * One-to-many relationship with reports
     */
    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    /**
     * One-to-many relationship with feedbacks
     */
    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }
}

