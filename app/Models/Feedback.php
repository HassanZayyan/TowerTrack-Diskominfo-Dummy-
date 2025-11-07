<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;
    
    protected $table = 'feedbacks';
    
    protected $fillable = [
        'tower_id',
        'user_id',
        'email',
        'sender_phone',
        'sender_name',
        'category',
        'message',
        'status',
        'reporter_latitude',
        'reporter_longitude',
        'reporter_accuracy',
        'location_captured_at',
        'is_public',
    ];
    
    public function tower()
    {
        return $this->belongsTo(Tower::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function assets()
    {
        return $this->hasMany(FeedbackAsset::class);
    }
    
    public function responses()
    {
        return $this->hasMany(FeedbackResponse::class);
    }
    
    /**
     * Get all comments for this feedback.
     */
    public function comments()
    {
        return $this->morphMany(PublicComment::class, 'commentable')
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc');
    }
}
