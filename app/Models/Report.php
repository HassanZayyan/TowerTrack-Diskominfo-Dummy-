<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'tower_id',
        'user_id',
        'reporter_name',
        'reporter_phone',
        'category',
        'message',
        'status_id',
    ];
    
    public function tower()
    {
        return $this->belongsTo(Tower::class);
    }
    
    public function assets()
    {
        return $this->hasMany(ReportAsset::class);
    }
    
    public function responses()
    {
        return $this->hasMany(ReportResponse::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function status()
    {
        return $this->belongsTo(Status::class);
    }
    
    public function images()
    {
        return $this->hasMany(ReportAsset::class);
    }
}
