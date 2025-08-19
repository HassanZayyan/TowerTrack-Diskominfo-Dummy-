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
        $perPage = $request->get('per_page', 5); // Default 5 per page
        if ($perPage === 'all') {
            $perPage = (int)Tower::count(); // Get all towers and ensure it's an integer
        } else {
            $perPage = (int)$perPage; // Ensure per_page is always an integer
        }

        $query = Tower::with('owners')->orderBy('site_name');

        // Handle search
        if ($search = $request->get('search')) {
            $query->where(function($q) use ($search) {
                $q->where('site_name', 'like', "%{$search}%")
                  ->orWhere('site_id', 'like', "%{$search}%")
                  ->orWhere('site_sap', 'like', "%{$search}%")
                  ->orWhereHas('owners', function($ownerQuery) use ($search) {
                      $ownerQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Handle filter
        if ($filter = $request->get('filter')) {
            if ($filter !== 'all') {
                $query->where('site_type', 'like', "%{$filter}%");
            }
        }

        $towers = $query->paginate($perPage);

        // Manually transform towers to include owner information
        $transformedItems = [];
        foreach ($towers->items() as $tower) {
            $primaryOwner = $tower->owners->first();
            $towerData = $tower->toArray();
            
            // Add owner information manually rather than using accessors
            $towerData['owner'] = $primaryOwner ? $primaryOwner->name : null;
            $towerData['alamat_owner'] = $primaryOwner ? $primaryOwner->alamat : null;
            $towerData['id_no_urut'] = $tower->id;
            
            $transformedItems[] = $towerData;
        }
        
        // Replace the collection in the paginator with our manually transformed data
        $towersCollection = new \Illuminate\Pagination\LengthAwarePaginator(
            $transformedItems,
            $towers->total(),
            $towers->perPage(),
            $towers->currentPage(),
            [
                'path' => \Illuminate\Support\Facades\Request::url(),
                'query' => \Illuminate\Support\Facades\Request::query(),
            ]
        );

        // Get statistics for all towers using direct database queries for better performance
        $statistics = [
            'total' => Tower::count(),
            'with_permits' => Tower::whereNotNull('status_ijin')->where('status_ijin', '!=', '')->count(),
            'with_coordinates' => Tower::whereNotNull('latitude')->whereNotNull('longitude')->count(),
            'without_coordinates' => Tower::where(function($query) {
                $query->whereNull('latitude')->orWhereNull('longitude')
                      ->orWhere('latitude', '')->orWhere('longitude', '');
            })->count(),
            'average_height' => round(Tower::where('tinggi_menara', '>', 0)->avg('tinggi_menara') ?: 0, 2),
        ];

        $owners = Owner::orderBy('name')->get();

        return Inertia::render('Admin/Towers', [
            'towers' => $towersCollection,
            'owners' => $owners,
            'statistics' => $statistics,
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


