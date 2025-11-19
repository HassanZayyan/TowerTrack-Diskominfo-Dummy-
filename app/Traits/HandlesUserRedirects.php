<?php

namespace App\Traits;

trait HandlesUserRedirects
{
    /**
     * Get the redirect destination based on user role.
     *
     * @param \App\Models\User $user
     * @param bool $withVerifiedParam Whether to append ?verified=1 to the URL
     * @return string
     */
    protected function getRedirectDestination($user, bool $withVerifiedParam = false): string
    {
        $destination = route('dashboard', absolute: false);

        if (in_array($user->role, ['admin', 'operator', 'tower_owner'], true)) {
            if ($user->role === 'tower_owner') {
                $destination = route('admin.towers.index', absolute: false);
            } else {
                $destination = route('admin.dashboard', absolute: false);
            }
        }

        return $withVerifiedParam ? $destination . '?verified=1' : $destination;
    }
}

