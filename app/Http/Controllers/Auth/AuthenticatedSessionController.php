<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\TowerShowcase;
use App\Traits\HandlesUserRedirects;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    use HandlesUserRedirects;

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            // Positions for the model in the right-hand panel. See the note on
            // TowerShowcase for why the login page is allowed to run a query
            // for a drawing, and what it deliberately does not ask for.
            'showcase' => TowerShowcase::panel(),
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

        // Use trait method for consistent redirects
        return redirect()->intended($this->getRedirectDestination($user, false));
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
