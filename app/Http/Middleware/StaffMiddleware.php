<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffMiddleware
{
    /**
     * Allow admin, operator, tower_owner, and provider_owner.
     * Tower owner and provider owner access is further restricted by access control middleware for specific routes
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin','operator','tower_owner','provider_owner'], true)) {
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}


