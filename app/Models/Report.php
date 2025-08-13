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
        'reporter_phone',
        'category',
        'message',
        'status',
    ];
    
    public function tower()
    {
        return $this->belongsTo(Tower::class);
    }
    
    public function images()
    {
        return $this->hasMany(ReportImage::class);
    }
    
    public function responses()
    {
        return $this->hasMany(ReportResponse::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
