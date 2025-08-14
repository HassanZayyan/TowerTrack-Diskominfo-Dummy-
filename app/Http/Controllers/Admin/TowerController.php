<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use App\Models\Owner;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TowerController extends Controller
{
    public function index(Request $request)
    {
        $towers = Tower::with('owners')
            ->orderBy('site_name')
            ->paginate(20);

        $owners = Owner::orderBy('name')->get();

        return Inertia::render('Admin/Towers', [
            'towers' => $towers,
            'owners' => $owners,
        ]);
    }

    public function create()
    {
        $owners = Owner::orderBy('name')->get();
        
        return Inertia::render('Admin/TowerCreate', [
            'owners' => $owners,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Basic Information
            'site_name' => 'required|string|max:255',
            'site_id' => 'nullable|string|max:100',
            'site_sap' => 'nullable|string|max:100',
            'site_type' => 'nullable|string|max:100',
            
            // Owner Information
            'owner_id' => 'nullable|string',
            'owner_name' => 'nullable|string|max:255',
            'owner_alamat' => 'nullable|string|max:1000',
            
            // Location Information
            'alamat_menara' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            
            // Technical Information
            'tinggi_menara' => 'nullable|numeric|min:0',
            'tinggi_bangunan' => 'nullable|numeric|min:0',
            'jumlah_pengguna' => 'nullable|integer|min:0',
            'jumlah_kaki' => 'nullable|integer|min:0',
            'tower_type' => 'nullable|string|max:100',
            'prs' => 'nullable|string|max:255',
            'prs_id' => 'nullable|string|max:100',
            
            // Permit Information
            'status_ijin' => 'nullable|string|max:100',
            'no_ijin' => 'nullable|string|max:100',
            'tanggal_ijin' => 'nullable|date',
            'berlaku_hingga' => 'nullable|date',
            'jenis_ijin' => 'nullable|string|max:100',
        ]);

        // Handle owner creation or selection
        $ownerId = null;
        if ($validated['owner_id'] === 'new' && $validated['owner_name']) {
            // Create new owner
            $owner = Owner::create([
                'name' => $validated['owner_name'],
                'alamat' => $validated['owner_alamat'] ?? '',
            ]);
            $ownerId = $owner->id;
        } elseif ($validated['owner_id'] && $validated['owner_id'] !== 'new') {
            // Use existing owner
            $ownerId = (int) $validated['owner_id'];
        }

        // Remove owner fields from tower data
        unset($validated['owner_id'], $validated['owner_name'], $validated['owner_alamat']);

        // Create tower
        $tower = Tower::create($validated);

        // Create tower-owner relationship if owner is selected
        if ($ownerId) {
            $tower->owners()->attach($ownerId);
        }

        return redirect()->route('admin.towers.index')->with('success', 'Tower berhasil ditambahkan!');
    }

    public function update(Request $request, Tower $tower)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'tinggi_menara' => 'nullable|numeric|min:0',
            'alamat_menara' => 'nullable|string|max:1000',
            'site_type' => 'nullable|string|max:255',
            'status_ijin' => 'nullable|string|max:255',
        ]);

        $tower->update($validated);
        return back();
    }
}


