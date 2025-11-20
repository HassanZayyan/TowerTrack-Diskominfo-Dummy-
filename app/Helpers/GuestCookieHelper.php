<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

/**
 * Guest Cookie Helper
 * 
 * Manages encrypted cookies for guest user contact data (email, phone, name).
 * This allows auto-filling forms on the same device without requiring users
 * to re-enter their information.
 * 
 * Security:
 * - Data is encrypted using Laravel Crypt (AES-256-CBC)
 * - Cookie uses HttpOnly flag (prevents JavaScript access)
 * - Cookie uses Secure flag when HTTPS is enabled
 * - Cookie uses SameSite policy to prevent CSRF
 * 
 * Usage:
 *   // Store guest data after submission
 *   GuestCookieHelper::store([
 *       'email' => 'user@example.com',
 *       'phone' => '081234567890',
 *       'name' => 'John Doe',
 *   ]);
 * 
 *   // Retrieve guest data for auto-fill
 *   $data = GuestCookieHelper::retrieve();
 *   if ($data) {
 *       $email = $data['email'];
 *       $phone = $data['phone'];
 *       $name = $data['name'];
 *   }
 * 
 *   // Clear guest cookie
 *   GuestCookieHelper::clear();
 */
class GuestCookieHelper
{
    /**
     * Cookie name for guest contact data
     */
    private const COOKIE_NAME = 'guest_contact_data';

    /**
     * Cookie expiry in minutes (30 days)
     */
    private const COOKIE_EXPIRY = 30 * 24 * 60;

    /**
     * Maximum age of cookie data in days (30 days)
     * After this, cookie will be considered expired even if not expired by browser
     */
    private const MAX_DATA_AGE_DAYS = 30;

    /**
     * Store guest contact data in encrypted cookie
     * 
     * @param array $data Array containing 'email', 'phone', and optionally 'name'
     * @return void
     */
    public static function store(array $data): void
    {
        // Validate required fields
        if (empty($data['email']) || empty($data['phone'])) {
            return;
        }

        // Prepare data for encryption
        $cookieData = [
            'email' => $data['email'],
            'phone' => $data['phone'],
            'name' => $data['name'] ?? '',
            'stored_at' => now()->toIso8601String(),
        ];

        try {
            // Encrypt the data
            $encrypted = Crypt::encrypt(json_encode($cookieData));

            // Get cookie settings from session config (which reads from .env)
            $path = config('session.path', '/');
            $domain = config('session.domain');
            $secure = config('session.secure', false);
            $sameSite = config('session.same_site', 'lax');

            // Queue the cookie (will be sent with response)
            Cookie::queue(
                self::COOKIE_NAME,
                $encrypted,
                self::COOKIE_EXPIRY,
                $path,
                $domain,
                $secure,
                true, // httpOnly - prevent JavaScript access
                false, // raw
                $sameSite
            );
        } catch (\Exception $e) {
            // Log error but don't break the application
            \Log::warning('Failed to store guest cookie', [
                'error' => $e->getMessage(),
                'email' => $data['email'] ?? null,
            ]);
        }
    }

    /**
     * Retrieve guest contact data from cookie
     * 
     * @return array|null Returns array with 'email', 'phone', 'name' or null if not found/invalid
     */
    public static function retrieve(): ?array
    {
        $cookie = request()->cookie(self::COOKIE_NAME);

        if (!$cookie) {
            return null;
        }

        try {
            // Decrypt the data
            $decrypted = json_decode(Crypt::decrypt($cookie), true);

            // Validate data structure
            if (!is_array($decrypted) || !isset($decrypted['email']) || !isset($decrypted['phone'])) {
                return null;
            }

            // Check if cookie data is too old
            if (isset($decrypted['stored_at'])) {
                try {
                    $storedAt = Carbon::parse($decrypted['stored_at']);
                    $ageInDays = $storedAt->diffInDays(now());

                    if ($ageInDays > self::MAX_DATA_AGE_DAYS) {
                        // Cookie data is too old, clear it
                        self::clear();
                        return null;
                    }
                } catch (\Exception $e) {
                    // Invalid date, clear cookie
                    self::clear();
                    return null;
                }
            }

            return [
                'email' => $decrypted['email'],
                'phone' => $decrypted['phone'],
                'name' => $decrypted['name'] ?? '',
            ];
        } catch (\Exception $e) {
            // Failed to decrypt or invalid data, clear the cookie
            \Log::warning('Failed to retrieve guest cookie', [
                'error' => $e->getMessage(),
            ]);
            self::clear();
            return null;
        }
    }

    /**
     * Clear guest cookie
     * 
     * @return void
     */
    public static function clear(): void
    {
        try {
            Cookie::queue(Cookie::forget(self::COOKIE_NAME));
        } catch (\Exception $e) {
            \Log::warning('Failed to clear guest cookie', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}