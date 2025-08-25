<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TowerAccessMiddleware
{
    /**
     * Handle an incoming request.
     * Allow admin, operator, and tower_owner to access tower-related pages (CRUD operations)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'operator', 'tower_owner'], true)) {
            abort(403, 'Unauthorized - Hanya admin, operator, dan tower owner yang dapat mengakses halaman ini');
        }

        return $next($request);
    }
}
