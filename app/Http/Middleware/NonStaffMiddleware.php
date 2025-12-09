<?php

namespace App\Http\Middleware;

use App\Traits\HandlesUserRedirects;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allow only non-staff (regular) users to proceed.
 * Staff here means users with roles: admin, operator, tower_owner, or provider_owner.
 * If a staff user hits these routes, redirect them to the appropriate staff dashboard.
 */
class NonStaffMiddleware
{
    use HandlesUserRedirects;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If not authenticated and accessing feedback routes, redirect to login
        if (!$user && $request->is('feedback*', 'my-feedbacks*')) {
            return redirect()->route('login')->with('message', 'Silakan login terlebih dahulu untuk mengirim masukan.');
        }

        // Route should already be protected by 'auth'. As an extra guard:
        if ($user && in_array($user->role, ['admin', 'operator', 'tower_owner', 'provider_owner'], true)) {
            return redirect($this->getRedirectDestination($user));
        }

        return $next($request);
    }
}


