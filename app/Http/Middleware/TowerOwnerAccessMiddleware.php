<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TowerOwnerAccessMiddleware
{
    /**
     * Handle an incoming request.
     * Tower owner can only access tower-related pages and dashboard
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || ($user->role !== 'tower_owner')) {
            abort(403, 'Unauthorized');
        }

        // Check if the route is tower-related or dashboard
        $allowedRoutes = [
            'admin.towers.index',
            'admin.towers.create',
            'admin.towers.store',
            'admin.towers.update',
            'admin.dashboard'
        ];

        $currentRoute = $request->route()->getName();
        
        if (!in_array($currentRoute, $allowedRoutes)) {
            abort(403, 'Tower owner hanya dapat mengakses halaman tower dan dashboard');
        }

        return $next($request);
    }
}


















