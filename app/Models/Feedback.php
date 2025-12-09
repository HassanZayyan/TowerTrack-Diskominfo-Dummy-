<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Commentable;
use App\Traits\HasGuestEmailVerification;
use App\Services\CacheService;

class Feedback extends Model
{
    use HasFactory;
    use Commentable;
    use HasGuestEmailVerification;
    
    protected $table = 'feedbacks';
    
    protected $fillable = [
        'feedbackable_type',
        'feedbackable_id',
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
        'email_verified_at',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_public' => 'boolean',
    ];
    
    /**
     * Polymorphic relationship to Tower or FoPoint
     */
    public function feedbackable()
    {
        return $this->morphTo();
    }
    
    /**
     * Get the tower if feedbackable is a Tower (for backward compatibility)
     */
    public function tower()
    {
        return $this->feedbackable_type === Tower::class ? $this->feedbackable : null;
    }
    
    /**
     * Get the FO point if feedbackable is a FoPoint
     */
    public function foPoint()
    {
        return $this->feedbackable_type === FoPoint::class ? $this->feedbackable : null;
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
     * Boot the model and set up cache invalidation
     */
    protected static function booted(): void
    {
        static::created(function ($feedback) {
            CacheService::invalidateByPattern('my_messages:*');
            CacheService::invalidateByPattern('my_posts_feedbacks:*');
        });

        static::updated(function ($feedback) {
            CacheService::invalidateByPattern('my_messages:*');
            CacheService::invalidateByPattern('my_posts_feedbacks:*');
            CacheService::invalidateByPattern('feedbacks:*');
        });

        static::deleted(function ($feedback) {
            CacheService::invalidateByPattern('my_messages:*');
            CacheService::invalidateByPattern('my_posts_feedbacks:*');
            CacheService::invalidateByPattern('feedbacks:*');
        });
    }
}
