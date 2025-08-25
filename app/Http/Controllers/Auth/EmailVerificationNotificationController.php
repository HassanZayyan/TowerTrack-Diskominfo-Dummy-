<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
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

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
