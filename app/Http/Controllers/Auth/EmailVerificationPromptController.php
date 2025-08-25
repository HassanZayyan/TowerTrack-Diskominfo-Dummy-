<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        if ($request->user()->hasVerifiedEmail()) {
            $user = $request->user();
            if (in_array($user->role, ['admin','operator','tower_owner'], true)) {
                if ($user->role === 'tower_owner') {
                    $dest = route('admin.towers.index', absolute: false);
                } else {
                    $dest = route('admin.dashboard', absolute: false);
                }
            } else {
                $dest = route('dashboard', absolute: false);
            }
            return redirect()->intended($dest);
        }
        return Inertia::render('Auth/VerifyEmail', ['status' => session('status')]);
    }
}
