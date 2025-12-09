<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Trait for filtering resources by ownership
 * Provides DRY methods for controllers to filter data based on user role and ownership
 */
trait HasResourceOwnership
{
    /**
     * Filter query by ownership based on user role
     * 
     * @template T of \Illuminate\Database\Eloquent\Model
     * @param Builder<T> $query
     * @param User|null $user
     * @param string $resourceType 'tower' or 'fo_point'
     * @return Builder<T>
     */
    protected function filterByOwnership(Builder $query, ?User $user, string $resourceType): Builder
    {
        if (!$user) {
            return $query;
        }

        if ($user->role === 'tower_owner' && $resourceType === 'tower') {
            return $query->whereHas('owners', function($q) use ($user) {
                $q->where('owners.id', $user->owner_id);
            });
        }
        
        if ($user->role === 'provider_owner' && $resourceType === 'fo_point') {
            return $query->whereHas('providers', function($q) use ($user) {
                $q->where('fo_providers.id', $user->fo_provider_id);
            });
        }
        
        return $query;
    }

    /**
     * Check if user can access a specific resource
     * 
     * @param User|null $user
     * @param mixed $resource Tower or FoPoint instance
     * @param string $resourceType 'tower' or 'fo_point'
     * @return bool
     */
    protected function canAccessResource($user, $resource, string $resourceType): bool
    {
        if (!$user || !$resource) {
            return false;
        }

        // Admin and operator can access all resources
        if (in_array($user->role, ['admin', 'operator'], true)) {
            return true;
        }

        if ($user->role === 'tower_owner' && $resourceType === 'tower') {
            return $user->owner && $user->owner->towers()->where('towers.id', $resource->id)->exists();
        }

        if ($user->role === 'provider_owner' && $resourceType === 'fo_point') {
            return $user->provider && $user->provider->foPoints()->where('fo_points.id', $resource->id)->exists();
        }

        return false;
    }
}

