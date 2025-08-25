<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffMiddleware
{
    /**
     * Allow admin, operator, and tower_owner.
     * Tower owner access is further restricted by TowerOwnerAccessMiddleware for specific routes
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin','operator','tower_owner'], true)) {
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}


