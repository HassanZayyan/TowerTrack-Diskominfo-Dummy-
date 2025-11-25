<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS hanya jika FORCE_HTTPS=true atau menggunakan ngrok
        $appUrl = config('app.url');
        $forceHttps = env('FORCE_HTTPS', false);
        
        if ($forceHttps || ($appUrl && str_contains($appUrl, 'ngrok'))) {
            URL::forceScheme('https');
        }
        
        Vite::prefetch(concurrency: 3);
    }
}