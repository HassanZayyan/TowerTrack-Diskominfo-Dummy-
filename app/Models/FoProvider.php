<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * FO Provider Model (Master Provider)
 * 
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $default_sort_order
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\FoPoint> $foPoints
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\FoPoint> $activeFoPoints
 */
class FoProvider extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * This is now the master provider table
     *
     * @var string
     */
    protected $table = 'fo_providers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'default_sort_order',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'default_sort_order' => 'integer',
    ];

    /**
     * Get the FO points that have this provider.
     * Many-to-many relationship through pivot table
     */
    public function foPoints(): BelongsToMany
    {
        return $this->belongsToMany(FoPoint::class, 'fo_point_provider')
                    ->withPivot('is_active', 'sort_order')
                    ->withTimestamps()
                    ->orderByPivot('sort_order');
    }

    /**
     * Get active FO points (where provider is active on that point)
     */
    public function activeFoPoints(): BelongsToMany
    {
        return $this->foPoints()->wherePivot('is_active', true);
    }

    /**
     * Scope untuk filter provider aktif.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope untuk ordering by default_sort_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('default_sort_order')->orderBy('name');
    }

    /**
     * Get users (provider owners) associated with this provider
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'fo_provider_id');
    }

    /**
     * Get provider owner users (users with provider_owner role)
     */
    public function providerOwners(): HasMany
    {
        return $this->users()->where('role', 'provider_owner');
    }

    /**
     * Create a default provider owner user for this provider
     * 
     * @param string|null $email Optional custom email, otherwise auto-generated
     * @param string|null $password Optional custom password, otherwise auto-generated
     * @return \App\Models\User
     */
    public function createProviderOwnerUser(?string $email = null, ?string $password = null): User
    {
        // Generate email if not provided
        if (!$email) {
            $email = $this->generateProviderOwnerEmail();
        }

        // Generate password if not provided
        if (!$password) {
            $password = \Illuminate\Support\Str::random(12);
        }

        // Check if user already exists
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            // If user exists but not linked to this provider, link it
            if ($existingUser->fo_provider_id !== $this->id) {
                $existingUser->update(['fo_provider_id' => $this->id]);
            }
            return $existingUser;
        }

        // Create new provider owner user
        return User::create([
            'name' => "Provider Owner - {$this->name}",
            'email' => $email,
            'password' => \Illuminate\Support\Facades\Hash::make($password),
            'role' => 'provider_owner',
            'fo_provider_id' => $this->id,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Generate a default email for provider owner based on provider name
     */
    private function generateProviderOwnerEmail(): string
    {
        return self::generateOwnerEmail($this->name);
    }

    /**
     * Find or create provider for owner user
     * Validates that provider is not already linked to another user
     * 
     * @param string $providerName
     * @param \App\Models\User|null $excludeUser User to exclude from duplicate check (for updates)
     * @return self
     * @throws \Exception If provider is already linked to another user
     */
    public static function findOrCreateForOwner(string $providerName, ?User $excludeUser = null): self
    {
        $provider = self::where('name', $providerName)->first();
        
        if (!$provider) {
            // Create new provider
            $provider = self::create([
                'name' => $providerName,
                'description' => null,
                'default_sort_order' => self::getNextSortOrder(),
                'is_active' => true,
            ]);
        } else {
            // Check if linked to another user
            $existingUserQuery = User::where('fo_provider_id', $provider->id)
                ->where('role', 'provider_owner');
            
            if ($excludeUser) {
                $existingUserQuery->where('id', '!=', $excludeUser->id);
            }
            
            $existingUser = $existingUserQuery->first();
            
            if ($existingUser) {
                throw new \Exception("Provider '{$provider->name}' sudah terhubung dengan user lain.");
            }
        }
        
        return $provider;
    }

    /**
     * Build sync data for provider pivot table
     * Used when syncing providers to FO points
     * 
     * @param array $providerIds Array of provider IDs
     * @return array Sync data for pivot table
     */
    public static function buildSyncData(array $providerIds): array
    {
        $syncData = [];
        foreach ($providerIds as $index => $providerId) {
            $provider = self::find($providerId);
            if ($provider) {
                $syncData[$providerId] = [
                    'is_active' => true,
                    'sort_order' => $provider->default_sort_order ?? $index,
                ];
            }
        }
        return $syncData;
    }

    /**
     * Get next sort order for new provider
     * 
     * @return int Next sort order value
     */
    public static function getNextSortOrder(): int
    {
        return (self::max('default_sort_order') ?? 0) + 1;
    }

    /**
     * Generate email address for provider owner based on provider name
     * Unified method used across the application
     * 
     * @param string $providerName Provider name
     * @param string $domain Email domain (default: '@provider.local')
     * @return string Generated email address
     */
    public static function generateOwnerEmail(string $providerName, string $domain = '@provider.local'): string
    {
        // Remove common prefixes (PT, CV, UD, Toko, etc.)
        $cleanName = preg_replace('/^(pt|cv|ud|tok|toko)\s+/i', '', strtolower($providerName));
        
        // Remove special characters and spaces
        $sanitized = preg_replace('/[^a-z0-9]/', '', $cleanName);
        
        // Limit length to avoid too long emails
        $sanitized = substr($sanitized, 0, 30);
        
        $baseEmail = $sanitized . $domain;
        
        // Ensure uniqueness
        $counter = 1;
        $email = $baseEmail;
        while (User::where('email', $email)->exists()) {
            $email = $sanitized . $counter . $domain;
            $counter++;
        }
        
        return $email;
    }
}
