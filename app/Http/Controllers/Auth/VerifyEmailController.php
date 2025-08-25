<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            $user = $request->user();
            if (in_array($user->role, ['admin','operator','tower_owner'], true)) {
                $dest = route('admin.dashboard', absolute: false);
            } else {
                $dest = route('dashboard', absolute: false);
            }
            return redirect()->intended($dest.'?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        $user = $request->user();
        if (in_array($user->role, ['admin','operator','tower_owner'], true)) {
            $dest = route('admin.dashboard', absolute: false);
        } else {
            $dest = route('dashboard', absolute: false);
        }
        return redirect()->intended($dest.'?verified=1');
    }
}
