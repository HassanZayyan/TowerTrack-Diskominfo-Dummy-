<?php

namespace App\Traits;

use App\Services\CacheService;

/**
 * Trait untuk invalidate cache ketika response/comment dibuat/updated/deleted
 * DRY: Menghilangkan duplikasi logika cache invalidation
 */
trait InvalidatesMessageCache
{
    /**
     * Boot the model and set up cache invalidation
     */
    protected static function bootInvalidatesMessageCache(): void
    {
        static::created(function ($model) {
            static::invalidateMessageCache($model);
        });

        static::updated(function ($model) {
            static::invalidateMessageCache($model);
        });

        static::deleted(function ($model) {
            static::invalidateMessageCache($model);
        });
    }

    /**
     * Invalidate cache for message-related models
     * 
     * @param \Illuminate\Database\Eloquent\Model $model
     * @return void
     */
    protected static function invalidateMessageCache($model): void
    {
        $parent = static::getParentModel($model);
        
        if (!$parent) {
            return;
        }

        // Touch parent to update its updated_at timestamp
        $parent->touch();

        // Get cache patterns based on parent type
        $patterns = static::getCachePatterns($parent);

        // Invalidate all related caches
        foreach ($patterns as $pattern) {
            CacheService::invalidateByPattern($pattern);
        }
    }

    /**
     * Get parent model based on model type
     * Override in child classes if needed
     * 
     * @param \Illuminate\Database\Eloquent\Model $model
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    protected static function getParentModel($model)
    {
        // For response models
        if (method_exists($model, 'report')) {
            return $model->report;
        }
        
        if (method_exists($model, 'feedback')) {
            return $model->feedback;
        }
        
        // For comment models
        if (method_exists($model, 'commentable')) {
            return $model->commentable;
        }

        return null;
    }

    /**
     * Get cache patterns to invalidate based on parent type
     * Override in child classes if needed
     * 
     * @param \Illuminate\Database\Eloquent\Model $parent
     * @return array<string>
     */
    protected static function getCachePatterns($parent): array
    {
        $patterns = [
            'my_messages:*',
            'guest_private_messages:*',
        ];

        // Add specific patterns based on parent type
        if ($parent instanceof \App\Models\Report) {
            $patterns[] = 'my_posts_reports:*';
            $patterns[] = 'reports:*';
        } elseif ($parent instanceof \App\Models\Feedback) {
            $patterns[] = 'my_posts_feedbacks:*';
            $patterns[] = 'feedbacks:*';
        }

        return $patterns;
    }
}

