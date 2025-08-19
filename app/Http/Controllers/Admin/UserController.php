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
        $users = User::query()->orderBy('name')->get(['id','name','email','role','created_at']);
        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Creating user', ['data' => $request->except('password')]);
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,operator',
            ]);
            $validated['password'] = Hash::make($validated['password']);
            $user = User::create($validated);
            \Log::info('User created successfully', ['id' => $user->id]);
            return back()->with('success', 'Pengguna berhasil ditambahkan');
        } catch (\Exception $e) {
            \Log::error('Failed to create user', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Gagal menambahkan pengguna: ' . $e->getMessage()])->withInput($request->except('password'));
        }
    }

    public function update(Request $request, User $user)
    {
        try {
            \Log::info('Updating user', ['id' => $user->id, 'data' => $request->except('password')]);
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,'.$user->id,
                'role' => 'required|in:admin,operator',
                'password' => 'nullable|string|min:8',
            ]);
            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }
            $user->update($validated);
            \Log::info('User updated successfully', ['id' => $user->id]);
            return back()->with('success', 'Pengguna berhasil diperbarui');
        } catch (\Exception $e) {
            \Log::error('Failed to update user', ['id' => $user->id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Gagal memperbarui pengguna: ' . $e->getMessage()])->withInput($request->except('password'));
        }
    }

    public function destroy(User $user)
    {
        try {
            \Log::info('Deleting user', ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]);
            $user->delete();
            \Log::info('User deleted successfully');
            return back()->with('success', 'Pengguna berhasil dihapus');
        } catch (\Exception $e) {
            \Log::error('Failed to delete user', ['id' => $user->id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Gagal menghapus pengguna: ' . $e->getMessage()]);
        }
    }
}


