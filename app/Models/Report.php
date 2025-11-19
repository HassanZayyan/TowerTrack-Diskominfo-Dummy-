<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Traits\Commentable;
use App\Traits\HasGuestEmailVerification;

class Report extends Model
{
    use HasFactory;
    use Commentable;
    use HasGuestEmailVerification;
    
    protected $fillable = [
        'tower_id',
        'user_id',
        'email',
        'reporter_name',
        'reporter_phone',
        'category',
        'message',
        'status_id',
        'reporter_latitude',
        'reporter_longitude',
        'reporter_accuracy',
        'location_captured_at',
        'is_public',
        'email_verified_at',
    ];
    
    protected $appends = ['status'];

    protected $casts = [
        'email_verified_at' => 'datetime',
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
    
    public function statusRelation()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }
    
    public function images()
    {
        return $this->hasMany(ReportAsset::class);
    }
    
    /**
     * Get the status slug attribute from status_id
     */
    protected function status(): Attribute
    {
        return Attribute::make(
            get: function () {
                $statusMap = [
                    1 => 'pending',
                    2 => 'in_progress',
                    3 => 'closed',
                ];
                return $statusMap[$this->status_id] ?? 'pending';
            }
        );
    }

}
