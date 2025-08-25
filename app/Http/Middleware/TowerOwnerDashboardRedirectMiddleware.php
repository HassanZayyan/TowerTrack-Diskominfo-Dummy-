<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TowerOwnerDashboardRedirectMiddleware
{
    /**
     * Handle an incoming request.
     * Redirect tower owners from dashboard to towers page
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'tower_owner') {
            return redirect()->route('admin.towers.index');
        }

        return $next($request);
    }
}


