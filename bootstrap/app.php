<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpFoundation\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies (e.g., ngrok) so forwarded proto/host are honored
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\PerformanceMonitoring::class,
        ]);

        // Register custom middleware aliases
        $middleware->alias([
            'tower.owner.dashboard.redirect' => \App\Http\Middleware\TowerOwnerDashboardRedirectMiddleware::class,
            'tower.owner.access.control' => \App\Http\Middleware\TowerOwnerAccessControlMiddleware::class,
            'admin_or_operator' => \App\Http\Middleware\AdminOrOperatorMiddleware::class,
            'validate.file.uploads' => \App\Http\Middleware\ValidateFileUploads::class,
        ]);

        // Ensure CSRF protection is properly configured
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'stripe/*',
            'webhook/*'
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
