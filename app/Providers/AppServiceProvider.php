<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\URL;
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
        // Ensure generated URLs (including assets/prefetch) use HTTPS when served via tunnels like ngrok
        URL::forceScheme('https');
        Vite::prefetch(concurrency: 3);
    }
}
