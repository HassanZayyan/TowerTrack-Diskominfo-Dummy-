<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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
        'kecamatan',
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
        'jumlah_pengguna' => 'integer',
        'jumlah_kaki' => 'integer',
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
}

