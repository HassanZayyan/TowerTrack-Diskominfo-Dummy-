<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use App\Models\Owner;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TowerController extends Controller
{
    /**
     * Normalize incoming tower payload: convert empty strings to null for nullable numeric/date fields
     */
    protected function normalizeTowerInput(array $input): array
    {
        $nullableNumericFields = [
            'latitude', 'longitude', 'tinggi_menara', 'tinggi_bangunan', 'jumlah_pengguna', 'jumlah_kaki'
        ];
        $nullableDateFields = ['tanggal_ijin', 'berlaku_hingga'];

        foreach ($nullableNumericFields as $field) {
            if (array_key_exists($field, $input) && $input[$field] === '') {
                $input[$field] = null;
            }
        }
        foreach ($nullableDateFields as $field) {
            if (array_key_exists($field, $input) && ($input[$field] === '' || $input[$field] === null)) {
                $input[$field] = null;
            }
        }

        return $input;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 5); // Default 5 per page
        if ($perPage === 'all') {
            $perPage = (int)Tower::count(); // Get all towers and ensure it's an integer
        } else {
            $perPage = (int)$perPage; // Ensure per_page is always an integer
        }

        $query = Tower::with('owners')->orderBy('site_name');
        
        // For tower owners, only show towers they own
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $query->whereHas('owners', function($ownerQuery) {
                $ownerQuery->where('owners.id', auth()->user()->owner_id);
            });
        }

        // Handle search
        if ($search = $request->get('search')) {
            $query->where(function($q) use ($search) {
                $q->where('site_name', 'like', "%{$search}%")
                  ->orWhere('site_id', 'like', "%{$search}%")
                  ->orWhere('site_sap', 'like', "%{$search}%")
                  ->orWhere('alamat_menara', 'like', "%{$search}%")
                  ->orWhereHas('owners', function($ownerQuery) use ($search) {
                      $ownerQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Handle comprehensive filters
        
        // Owner filter
        if ($owner = $request->get('owner')) {
            if ($owner !== 'all') {
                $query->whereHas('owners', function($ownerQuery) use ($owner) {
                    $ownerQuery->where('name', $owner);
                });
            }
        }
        
        // Tower type filter
        if ($towerType = $request->get('tower_type')) {
            if ($towerType !== 'all') {
                $query->where('tower_type', $towerType);
            }
        }
        
        // Site type filter
        if ($siteType = $request->get('site_type')) {
            if ($siteType !== 'all') {
                $query->where('site_type', $siteType);
            }
        }
        
        // Permit status filter
        if ($statusIjin = $request->get('status_ijin')) {
            if ($statusIjin !== 'all') {
                $query->where('status_ijin', $statusIjin);
            }
        }
        
        // Coordinates filter
        if ($hasCoordinates = $request->get('has_coordinates')) {
            if ($hasCoordinates === 'yes') {
                $query->whereNotNull('latitude')
                      ->whereNotNull('longitude')
                      ->where('latitude', '!=', '')
                      ->where('longitude', '!=', '');
            } elseif ($hasCoordinates === 'no') {
                $query->where(function($q) {
                    $q->whereNull('latitude')
                      ->orWhereNull('longitude')
                      ->orWhere('latitude', '')
                      ->orWhere('longitude', '');
                });
            }
        }
        
        // Permits filter
        if ($hasPermits = $request->get('has_permits')) {
            if ($hasPermits === 'yes') {
                $query->whereNotNull('status_ijin')
                      ->where('status_ijin', '!=', '');
            } elseif ($hasPermits === 'no') {
                $query->where(function($q) {
                    $q->whereNull('status_ijin')
                      ->orWhere('status_ijin', '');
                });
            }
        }
        
        // Height range filter
        if ($heightMin = $request->get('height_min')) {
            $query->where('tinggi_menara', '>=', (float)$heightMin);
        }
        if ($heightMax = $request->get('height_max')) {
            $query->where('tinggi_menara', '<=', (float)$heightMax);
        }
        
        // Specific tower ID filter
        if ($towerId = $request->get('tower_id')) {
            $query->where('id', $towerId);
        }

        $towers = $query->paginate($perPage);

        // Manually transform towers to include owner information
        $transformedItems = [];
        foreach ($towers->items() as $tower) {
            $primaryOwner = $tower->owners->first();
            $towerData = $tower->toArray();
            
            // Add owner information manually rather than using accessors
            $towerData['owner'] = $primaryOwner ? $primaryOwner->name : null;
            $towerData['owner_id'] = $primaryOwner ? (string) $primaryOwner->id : null;
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

        // Get statistics for towers (filtered for tower owners)
        $statisticsQuery = Tower::query();
        
        // For tower owners, only count towers they own
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $statisticsQuery->whereHas('owners', function($ownerQuery) {
                $ownerQuery->where('owners.id', auth()->user()->owner_id);
            });
        }
        
        $statistics = [
            'total' => $statisticsQuery->count(),
            'with_permits' => (clone $statisticsQuery)->whereNotNull('status_ijin')->where('status_ijin', '!=', '')->count(),
            'with_coordinates' => (clone $statisticsQuery)->whereNotNull('latitude')->whereNotNull('longitude')->count(),
            'without_coordinates' => (clone $statisticsQuery)->where(function($query) {
                $query->whereNull('latitude')->orWhereNull('longitude')
                      ->orWhere('latitude', '')->orWhere('longitude', '');
            })->count(),
            'average_height' => round((clone $statisticsQuery)->where('tinggi_menara', '>', 0)->avg('tinggi_menara') ?: 0, 2),
        ];

        // Get owners (filtered for tower owners)
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $owners = Owner::where('id', auth()->user()->owner_id)->orderBy('name')->get();
        } else {
            $owners = Owner::orderBy('name')->get();
        }

        // Get all towers for FilterPanel TowerSelectionInput (with structure compatible with feedback/complaint pages)
        // Only include towers with valid coordinates since TowerSelectionInput requires them
        $allTowersForFilterQuery = Tower::select([
            'id', 
            'site_name', 
            'alamat_menara',
            'latitude',
            'longitude',
            'tinggi_menara',
            'tinggi_bangunan',
            'jumlah_pengguna',
            'tower_type',
            'site_type'
        ])
        ->whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->where('latitude', '!=', 0)
        ->where('longitude', '!=', 0);
        
        // For tower owners, only include towers they own
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $allTowersForFilterQuery->whereHas('owners', function($ownerQuery) {
                $ownerQuery->where('owners.id', auth()->user()->owner_id);
            });
        }
        
        $allTowersForFilter = $allTowersForFilterQuery->orderBy('site_name')->get()->toArray();

        return Inertia::render('Admin/Towers', [
            'towers' => $towersCollection,
            'owners' => $owners,
            'statistics' => $statistics,
            'allTowers' => $allTowersForFilter, // Add this for FilterPanel
        ]);
    }

    public function create()
    {
        // For tower owners, only show their own owner record
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $owners = Owner::where('id', auth()->user()->owner_id)->orderBy('name')->get();
        } else {
            $owners = Owner::orderBy('name')->get();
        }
        
        return Inertia::render('Admin/TowerCreate', [
            'owners' => $owners,
        ]);
    }

    public function store(Request $request)
    {
        // Pre-normalize payload to avoid validation failures on empty strings
        $request->merge($this->normalizeTowerInput($request->all()));

        // Custom validation for alamat_menara - only required if tower doesn't have existing address
        $rules = [
            // Basic Information
            'site_name' => 'nullable|string|max:255',
            'site_id' => 'nullable|string|max:100',
            'site_sap' => 'nullable|string|max:100',
            'site_type' => 'nullable|string|max:100',
            
            // Owner Information
            'owner_id' => 'nullable|string',
            'owner_name' => 'nullable|string|max:255',
            'owner_alamat' => 'nullable|string|max:1000',
            
            // Location Information
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
        ];
        
        // Address is required for new towers
        $rules['alamat_menara'] = 'required|string|max:1000';
        
        $validated = $request->validate($rules);

        // Handle owner creation or selection
        $ownerId = null;
        
        // For tower owners, force them to use their own owner record
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $ownerId = auth()->user()->owner_id;
        } else {
            // For admin/operator, allow owner selection
            if (($validated['owner_id'] ?? null) === 'new' && ($validated['owner_name'] ?? null)) {
                // Create new owner
                $owner = Owner::create([
                    'name' => $validated['owner_name'],
                    'alamat' => $validated['owner_alamat'] ?? '',
                ]);
                $ownerId = $owner->id;
            } elseif (!empty($validated['owner_id']) && $validated['owner_id'] !== 'new') {
                // Use existing owner
                $ownerId = (int) $validated['owner_id'];
            }
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
        // For tower owners, ensure they can only update their own towers
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            if (!$tower->owners()->where('owners.id', auth()->user()->owner_id)->exists()) {
                abort(403, 'You can only update towers you own');
            }
        }
        
        // Pre-normalize payload to avoid validation failures on empty strings
        $request->merge($this->normalizeTowerInput($request->all()));

        $validated = $request->validate([
            // Basic Information
            'site_name' => 'nullable|string|max:255',
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

        // Handle owner update
        if (array_key_exists('owner_id', $validated)) {
            // For tower owners, force them to keep their own owner record
            if (auth()->user() && auth()->user()->role === 'tower_owner') {
                $ownerId = auth()->user()->owner_id;
                // Detach all existing owners and attach only their own
                $tower->owners()->detach();
                $tower->owners()->attach($ownerId);
            } else {
                // For admin/operator, allow owner changes
                // First, detach all existing owners
                $tower->owners()->detach();
                
                $ownerId = null;
                if ($validated['owner_id'] === 'new' && !empty($validated['owner_name'])) {
                    // Create new owner
                    $owner = Owner::create([
                        'name' => $validated['owner_name'],
                        'alamat' => $validated['owner_alamat'] ?? '',
                    ]);
                    $ownerId = $owner->id;
                } elseif (!empty($validated['owner_id']) && $validated['owner_id'] !== 'new') {
                    // Use existing owner
                    $ownerId = (int) $validated['owner_id'];
                }
                
                // Attach new owner if selected
                if ($ownerId) {
                    $tower->owners()->attach($ownerId);
                }
            }
        }

        // Remove owner fields from tower data
        unset($validated['owner_id'], $validated['owner_name'], $validated['owner_alamat']);

        $tower->update($validated);
        return back();
    }
}


