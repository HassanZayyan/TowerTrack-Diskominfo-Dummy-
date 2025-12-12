<?php

namespace App\Http\Middleware;

use App\Traits\HandlesUserRedirects;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware untuk redirect tower_owner dan provider_owner dari dashboard.
 * 
 * Tower owner akan di-redirect ke halaman tower management.
 * Provider owner akan di-redirect ke halaman FO management.
 * Admin dan operator tetap dapat mengakses dashboard.
 */
class OwnerDashboardRedirectMiddleware
{
    use HandlesUserRedirects;

    /**
     * Handle an incoming request.
     * 
     * @param Request $request
     * @param Closure $next
     * @return Response
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



