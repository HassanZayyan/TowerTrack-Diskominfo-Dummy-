<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CaptchaService
{
    /**
     * Verify Turnstile CAPTCHA token
     *
     * @param string $token The CAPTCHA token from frontend
     * @param string $ip The user's IP address
     * @return bool
     */
    public function verify(string $token, string $ip): bool
    {
        // Skip verification in testing environment
        if (app()->environment('testing')) {
            return true;
        }

        // Determine which secret key to use
        $secret = $this->getSecretKey();

        try {
            $response = Http::asForm()->timeout(10)->post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]
            );

            $result = $response->json();

            // Log in development for debugging
            if (app()->environment('local')) {
                Log::info('Turnstile CAPTCHA Verification', [
                    'success' => $result['success'] ?? false,
                    'errors' => $result['error-codes'] ?? [],
                    'ip' => $ip,
                ]);
            }

            return $result['success'] ?? false;
        } catch (\Exception $e) {
            Log::error('Turnstile CAPTCHA Verification Error', [
                'error' => $e->getMessage(),
                'ip' => $ip,
            ]);

            // In development, allow on error (for testing)
            if (app()->environment('local')) {
                return true;
            }

            return false;
        }
    }

    /**
     * Get the appropriate secret key based on environment
     *
     * @return string
     */
    private function getSecretKey(): string
    {
        // Use test key in local development
        if (app()->environment('local')) {
            return config('services.turnstile.test_secret_key') 
                ?? config('services.turnstile.secret_key');
        }

        // Use production key in staging/production
        return config('services.turnstile.secret_key');
    }

    /**
     * Get the appropriate site key based on environment
     *
     * @return string
     */
    public function getSiteKey(): string
    {
        // Always fallback to test key if site_key is not configured
        $siteKey = config('services.turnstile.site_key');
        $testSiteKey = config('services.turnstile.test_site_key', '1x00000000000000000000AA');
        
        // If no site key configured, always use test key
        if (empty($siteKey)) {
            return $testSiteKey;
        }

        // Use test key in local development
        if (app()->environment('local')) {
            return $testSiteKey;
        }

        // Use production key in staging/production
        return $siteKey;
    }
}

