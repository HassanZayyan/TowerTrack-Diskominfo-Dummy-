<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()->orderBy('name')->get(['id', 'name', 'email', 'role', 'created_at', 'banned']);
        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,operator,complainant,tower_owner',
            'banned' => 'boolean',
        ]);

        // Set banned status from request or default to false for new users
        $validated['banned'] = $validated['banned'] ?? false;
        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);
        return back();
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            // Gunakan "sometimes" agar field hanya divalidasi ketika ada di request,
            // memungkinkan pembaruan parsial seperti hanya mengganti status banned.
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'role' => 'sometimes|required|in:admin,operator,complainant,tower_owner',
            'password' => 'nullable|string|min:8',
            'banned' => 'boolean',
        ]);

        // Admin can ban all users including complainant and tower_owner
        // This validation is removed to allow admin full control over user management

        // Prevent self-banning
        if ($user->id === auth()->id() && $request->input('banned', false)) {
            return back()->with('error', 'Anda tidak dapat membanned akun Anda sendiri.');
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        return back();
    }

    public function destroy(User $user)
    {
        $user->delete();
        return back();
    }
}


