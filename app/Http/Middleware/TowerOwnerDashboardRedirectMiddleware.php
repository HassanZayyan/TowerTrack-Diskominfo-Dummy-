<?php

namespace App\Http\Middleware;

use App\Traits\HandlesUserRedirects;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TowerOwnerDashboardRedirectMiddleware
{
    use HandlesUserRedirects;

    /**
     * Handle an incoming request.
     * Redirect tower owners from dashboard to towers page
     * Redirect provider owners from dashboard to FO management page
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if ($user && in_array($user->role, ['tower_owner', 'provider_owner'], true)) {
            return redirect($this->getRedirectDestination($user));
        }

        return $next($request);
    }
}














