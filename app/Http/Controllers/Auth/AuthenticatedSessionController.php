<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        
        // Check for return URL (from private message redirect)
        $returnTo = $request->query('return_to');
        $selectPrivate = $request->query('select_private') === 'true';

        if ($returnTo && filter_var($returnTo, FILTER_VALIDATE_URL) === false) {
            // Only allow relative URLs for security
            $returnTo = ltrim(parse_url($returnTo, PHP_URL_PATH) ?? $returnTo, '/');
            
            // Redirect back to form with private selection flag
            if ($selectPrivate) {
                return redirect($returnTo)->with('select_private', true);
            }
            return redirect($returnTo);
        }

        // Redirect staff (admin/operator/tower_owner) to admin area by default
        if ($user && in_array($user->role, ['admin', 'operator', 'tower_owner'], true)) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
