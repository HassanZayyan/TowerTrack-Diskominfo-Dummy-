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
            'role' => 'required|in:admin,operator,complainant',
            'banned' => 'boolean',
        ]);

        // Set default banned status to false for new users
        $validated['banned'] = false;
        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);
        return back();
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'role' => 'required|in:admin,operator,complainant',
            'password' => 'nullable|string|min:8',
            'banned' => 'boolean',
        ]);

        // Ensure only admin can ban users
        if (!auth()->user()->isAdmin() && $request->has('banned')) {
            return back()->with('error', 'Hanya admin yang dapat mengubah status banned pengguna.');
        }

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


