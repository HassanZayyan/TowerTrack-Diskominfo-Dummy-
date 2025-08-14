<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allow only non-staff (regular) users to proceed.
 * Staff here means users with roles: admin or operator.
 * If a staff user hits these routes, redirect them to the staff dashboard.
 */
class NonStaffMiddleware
{
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
        if ($user && in_array($user->role, ['admin', 'operator'], true)) {
            return redirect()->route('admin.dashboard');
        }

        return $next($request);
    }
}


