<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
}

