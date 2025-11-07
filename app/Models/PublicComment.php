<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PublicComment extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'commentable_type',
        'commentable_id',
        'parent_id',
        'user_id',
        'guest_name',
        'guest_email',
        'guest_phone',
        'message',
        'is_approved',
    ];
    
    protected $casts = [
        'is_approved' => 'boolean',
    ];
    
    /**
     * Get the parent commentable model (Report or Feedback).
     */
    public function commentable()
    {
        return $this->morphTo();
    }
    
    /**
     * Get the user that owns the comment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get the display name for the comment author.
     */
    public function getAuthorNameAttribute(): string
    {
        return $this->user_id 
            ? $this->user->name 
            : ($this->guest_name ?? 'Guest');
    }
    
    /**
     * Get the display email for the comment author.
     */
    public function getAuthorEmailAttribute(): ?string
    {
        return $this->user_id 
            ? $this->user->email 
            : $this->guest_email;
    }
    
    /**
     * Check if comment is from a guest.
     */
    public function isGuest(): bool
    {
        return $this->user_id === null;
    }
    
    /**
     * Get the parent comment (if this is a reply).
     */
    public function parent()
    {
        return $this->belongsTo(PublicComment::class, 'parent_id');
    }
    
    /**
     * Get all replies to this comment.
     */
    public function replies()
    {
        return $this->hasMany(PublicComment::class, 'parent_id')
                    ->where('is_approved', true)
                    ->orderBy('created_at', 'asc');
    }
    
    /**
     * Scope to eager load nested replies recursively up to max depth.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $maxDepth Maximum nesting depth (default: 3)
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithNestedReplies($query, int $maxDepth = 3)
    {
        return $query->with(self::buildNestedRepliesEagerLoad($maxDepth));
    }
    
    /**
     * Build nested eager loading array for replies recursively.
     * Static method to be used in query builders and closures.
     * 
     * @param int $maxDepth Maximum depth to load
     * @param int $currentDepth Current depth (starts at 1)
     * @return array
     */
    public static function buildNestedRepliesEagerLoad(int $maxDepth, int $currentDepth = 1): array
    {
        // Load user and parent info for reply indicator
        $eagerLoad = [
            'user:id,name,email',
            'parent' => function($query) {
                $query->select('id', 'user_id', 'guest_name')
                      ->with('user:id,name');
            }
        ];
        
        // If we haven't reached max depth, load nested replies
        if ($currentDepth < $maxDepth) {
            $eagerLoad['replies'] = function($query) use ($maxDepth, $currentDepth) {
                $query->where('is_approved', true)
                      ->orderBy('created_at', 'asc')
                      ->with(self::buildNestedRepliesEagerLoad($maxDepth, $currentDepth + 1));
            };
        }
        
        return $eagerLoad;
    }
    
    /**
     * Check if this comment is a reply.
     */
    public function isReply(): bool
    {
        return $this->parent_id !== null;
    }
}
