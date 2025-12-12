<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\FoProvider;
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
            ->with('provider:id,name')
            ->orderBy('name')
            ->paginate($perPage, ['id', 'name', 'email', 'role', 'created_at', 'banned', 'deleted_at', 'fo_provider_id'], 'page', $page)
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
            'provider_name' => 'required_if:role,provider_owner|string|max:255',
            'banned' => 'boolean',
        ], [
            'email.unique' => 'Email ini sudah terdaftar. Silakan gunakan email lain.',
        ]);

        // Auto-create provider for provider_owner role
        if ($validated['role'] === 'provider_owner') {
            if (empty($validated['provider_name'])) {
                return back()->withErrors([
                    'provider_name' => 'Nama provider wajib diisi untuk role provider owner.'
                ]);
            }

            try {
                // Find or create provider, validate it's not linked to another user
                $provider = FoProvider::findOrCreateForOwner($validated['provider_name']);
                $validated['fo_provider_id'] = $provider->id;
            } catch (\Exception $e) {
                return back()->withErrors([
                    'provider_name' => $e->getMessage()
                ]);
            }
        } else {
            // Clear fo_provider_id for non-provider_owner roles
            unset($validated['provider_name']);
        }

        // Remove provider_name from validated (not a user field)
        unset($validated['provider_name']);

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
            'provider_name' => 'required_if:role,provider_owner|string|max:255',
            'password' => 'nullable|string|min:8',
            'banned' => 'boolean',
        ], [
            'email.unique' => 'Email ini sudah terdaftar. Silakan gunakan email lain.',
        ]);

        // Handle provider_owner role
        $newRole = $validated['role'] ?? $user->role;
        if ($newRole === 'provider_owner') {
            // If provider_name is provided, update/create provider
            if (isset($validated['provider_name']) && !empty($validated['provider_name'])) {
                $providerName = $validated['provider_name'];
                
                try {
                    // Find or create provider, exclude current user from duplicate check
                    $provider = FoProvider::findOrCreateForOwner($providerName, $user);
                    
                    // Update provider assignment
                    if ($user->fo_provider_id && $user->fo_provider_id !== $provider->id) {
                        // User had a different provider, update to new one
                        $validated['fo_provider_id'] = $provider->id;
                    } elseif ($user->fo_provider_id) {
                        // Same provider, update name if changed
                        if ($user->provider && $user->provider->name !== $providerName) {
                            $user->provider->update(['name' => $providerName]);
                        }
                    } else {
                        // User didn't have provider, assign new one
                        $validated['fo_provider_id'] = $provider->id;
                    }
                } catch (\Exception $e) {
                    return back()->withErrors([
                        'provider_name' => $e->getMessage()
                    ]);
                }
            } elseif (!$user->fo_provider_id) {
                // User is provider_owner but has no provider, require provider_name
                return back()->withErrors([
                    'provider_name' => 'Nama provider wajib diisi untuk role provider owner.'
                ]);
            }
        } else {
            // Clear fo_provider_id for non-provider_owner roles
            unset($validated['provider_name']);
            // If changing from provider_owner to another role, clear the provider link
            if ($user->role === 'provider_owner' && $newRole !== 'provider_owner') {
                $validated['fo_provider_id'] = null;
            }
        }

        // Remove provider_name from validated (not a user field)
        unset($validated['provider_name']);

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


