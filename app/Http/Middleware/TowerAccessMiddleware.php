<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware untuk mengontrol akses ke halaman tower management.
 * 
 * Mengizinkan admin, operator, dan tower_owner untuk mengakses halaman tower.
 * Untuk tower_owner, akses lebih lanjut dibatasi oleh TowerOwnerAccessControlMiddleware
 * yang memastikan mereka hanya bisa mengakses tower yang mereka miliki.
 */
class TowerAccessMiddleware
{
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
        if (!$user || !in_array($user->role, ['admin', 'operator', 'tower_owner'], true)) {
            abort(403, 'Unauthorized - Hanya admin, operator, dan tower owner yang dapat mengakses halaman ini');
        }

        return $next($request);
    }
}
