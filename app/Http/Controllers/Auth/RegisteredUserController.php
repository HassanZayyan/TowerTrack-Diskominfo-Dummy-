<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CaptchaService;
use App\Support\TowerShowcase;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response|RedirectResponse
    {
        // Check if there's a role parameter indicating tower owner registration attempt
        $role = request()->query('role');
        
        if ($role === 'tower_owner') {
            // Tower owners should not register - they should login with existing accounts
            return redirect()->route('login')->with('message', 
                'Tower owners should login with their existing accounts. If you need a tower owner account, please contact an administrator.'
            );
        }
        
        return Inertia::render('Auth/Register', [
            'showcase' => TowerShowcase::panel(),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'cf-turnstile-response' => 'required|string',
        ], [
            'email.unique' => 'Email ini sudah terdaftar. Silakan gunakan email lain.',
        ]);

        // Verify CAPTCHA
        $captchaService = app(CaptchaService::class);
        $token = $validated['cf-turnstile-response'] ?? '';
        $ipAddress = $request->ip();

        // Ensure token is a string and not empty
        if (empty($token) || !is_string($token)) {
            throw ValidationException::withMessages([
                'captcha' => 'Verifikasi CAPTCHA diperlukan. Silakan selesaikan CAPTCHA terlebih dahulu.',
            ]);
        }

        if (!$captchaService->verify($token, $ipAddress)) {
            throw ValidationException::withMessages([
                'captcha' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.',
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'complainant',
        ]);

        event(new Registered($user));

        Auth::login($user);

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

        return redirect(route('verification.notice'));
    }
}
