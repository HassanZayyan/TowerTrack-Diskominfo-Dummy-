<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FoAccessMiddleware
{
    /**
     * Handle an incoming request.
     * Allow admin, operator, and provider_owner to access FO-related pages (CRUD operations)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'operator', 'provider_owner'], true)) {
            abort(403, 'Unauthorized - Hanya admin, operator, dan provider owner yang dapat mengakses halaman ini');
        }

        return $next($request);
    }
}


