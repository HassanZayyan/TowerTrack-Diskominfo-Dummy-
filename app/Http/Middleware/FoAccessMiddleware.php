<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware untuk mengontrol akses ke halaman FO (Fiber Optic) management.
 * 
 * Mengizinkan admin, operator, dan provider_owner untuk mengakses halaman FO.
 * Untuk provider_owner, akses lebih lanjut dibatasi oleh ProviderOwnerAccessControlMiddleware
 * yang memastikan mereka hanya bisa mengakses FO points yang dimiliki provider mereka.
 */
class FoAccessMiddleware
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
        if (!$user || !in_array($user->role, ['admin', 'operator', 'provider_owner'], true)) {
            abort(403, 'Unauthorized - Hanya admin, operator, dan provider owner yang dapat mengakses halaman ini');
        }

        return $next($request);
    }
}

