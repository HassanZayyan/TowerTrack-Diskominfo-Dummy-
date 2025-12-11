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
        // Get pagination parameters
        $perPage = max(1, min(100, (int) $request->get('per_page', 15)));
        $page = max(1, (int) $request->get('page', 1));

        // Include soft deleted users with pagination
        $users = User::withTrashed()
            ->orderBy('name')
            ->paginate($perPage, ['id', 'name', 'email', 'role', 'created_at', 'banned', 'deleted_at'], 'page', $page)
            ->withQueryString();

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
            'role' => 'required|in:admin,operator,complainant,tower_owner,provider_owner',
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
            'role' => 'sometimes|required|in:admin,operator,complainant,tower_owner,provider_owner',
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
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }
        
        $user->delete(); // Soft delete
        
        return back()->with('success', "User '{$user->name}' berhasil dinonaktifkan. User dapat diaktifkan kembali jika diperlukan.");
    }

    public function restore($id)
    {
        $user = User::withTrashed()->findOrFail($id);
        
        // Prevent self-restore if user is trying to restore themselves (edge case)
        if ($user->id === auth()->id() && $user->trashed()) {
            return back()->with('error', 'Anda tidak dapat mengaktifkan kembali akun Anda sendiri.');
        }
        
        $user->restore();
        
        return back()->with('success', "User '{$user->name}' berhasil diaktifkan kembali.");
    }
}


