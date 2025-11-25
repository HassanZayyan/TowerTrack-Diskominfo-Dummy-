<?php

namespace App\Traits;

trait Commentable
{
    /**
     * Get all comments for this model (top-level only).
     */
    public function comments()
    {
        return $this->morphMany(\App\Models\PublicComment::class, 'commentable')
            ->whereNull('parent_id')
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc');
    }

    /**
     * Get all approved comments (top-level + replies).
     */
    public function allComments()
    {
        return $this->morphMany(\App\Models\PublicComment::class, 'commentable')
            ->where('is_approved', true);
    }
    
    /**
     * Get all comments with their replies.
     */
    public function commentsWithReplies()
    {
        return $this->morphMany(\App\Models\PublicComment::class, 'commentable')
            ->whereNull('parent_id')
            ->where('is_approved', true)
            ->with(['user:id,name,email', 'replies' => function($q) {
                $q->where('is_approved', true)
                  ->with('user:id,name,email')
                  ->orderBy('created_at', 'asc');
            }])
            ->orderBy('created_at', 'desc');
    }
}