<?php

namespace App\Traits;

use App\Models\User;

/**
 * Trait for handling provider owner validation and assignment
 * Provides DRY methods for controllers to validate and assign providers for provider owners
 */
trait HandlesProviderOwner
{
    /**
     * Validate and assign provider for provider owner
     * Ensures provider owner can only select their own provider
     * Auto-assigns provider if not provided
     * 
     * @param array $providers Array of provider IDs
     * @param \App\Models\User|null $user Current authenticated user
     * @return array Validated and assigned provider IDs
     * @throws \Illuminate\Http\Exceptions\HttpResponseException If invalid provider selected
     */
    protected function validateAndAssignProviderForOwner(array $providers, ?User $user): array
    {
        if (!$user || !$user->isProviderOwner()) {
            return $providers;
        }
        
        if (!empty($providers)) {
            // Validate that provider owner only selected their own provider
            $invalidProviders = array_diff($providers, [$user->fo_provider_id]);
            if (!empty($invalidProviders)) {
                abort(403, 'Anda hanya dapat memilih provider milik Anda sendiri.');
            }
        } else {
            // Auto-assign provider if not provided
            $providers = [$user->fo_provider_id];
        }
        
        return $providers;
    }

    /**
     * Ensure current user is not a provider owner
     * Used to prevent provider owners from creating/editing providers
     * 
     * @return void
     * @throws \Illuminate\Http\Exceptions\HttpResponseException If user is provider owner
     */
    protected function ensureNotProviderOwner(): void
    {
        $user = auth()->user();
        if ($user && $user->isProviderOwner()) {
            abort(403, 'Anda tidak memiliki izin untuk menambahkan provider baru.');
        }
    }
}

