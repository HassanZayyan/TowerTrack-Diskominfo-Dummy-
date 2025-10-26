<?php

namespace App\Http\Controllers;

use App\Models\Owner;
use App\Models\Tower;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TowerController extends Controller
{
    /**
     * Safely format a date field
     */
    private function formatDate($date): ?string
    {
        if (!$date) {
            return null;
        }
        
        try {
            return Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Display a listing of towers with filtering and pagination
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $coordFilter = $request->get('coord', 'all'); // all | with | without
        $ownerFilter = $request->get('owner', 'all');
        $perPage = 10;

        // Start building query with eager loading
        $query = Tower::with(['owners:id,name']);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('site_name', 'like', "%{$search}%")
                  ->orWhere('alamat_menara', 'like', "%{$search}%")
                  ->orWhereHas('owners', function ($ownerQuery) use ($search) {
                      $ownerQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Apply coordinate filter
        if ($coordFilter === 'with') {
            $query->whereNotNull('latitude')
                  ->whereNotNull('longitude')
                  ->where('latitude', '!=', '')
                  ->where('longitude', '!=', '')
                  ->where('latitude', '!=', 0)
                  ->where('longitude', '!=', 0);
        } elseif ($coordFilter === 'without') {
            $query->where(function ($q) {
                $q->whereNull('latitude')
                  ->orWhereNull('longitude')
                  ->orWhere('latitude', '')
                  ->orWhere('longitude', '')
                  ->orWhere('latitude', 0)
                  ->orWhere('longitude', 0);
            });
        }

        // Apply owner filter
        if ($ownerFilter && $ownerFilter !== 'all') {
            $query->whereHas('owners', function ($ownerQuery) use ($ownerFilter) {
                $ownerQuery->where('name', $ownerFilter);
            });
        }

        // Get paginated results
        $towers = $query->orderBy('site_name')
                       ->paginate($perPage)
                       ->withQueryString();

        // Transform the data to match frontend expectations (include full detail for modal)
        $towersData = $towers->map(function ($tower) use ($ownerFilter) {
            // If filtered by a specific owner, show that owner explicitly when present
            $ownerNames = $tower->owners->pluck('name');
            $displayOwner = $ownerFilter !== 'all' && $ownerNames->contains($ownerFilter)
                ? $ownerFilter
                : ($ownerNames->first() ?? '');

            return [
                'id' => $tower->id,
                'site_name' => $tower->site_name ?? '',
                'site_id' => $tower->site_id ?? '',
                'site_sap' => $tower->site_sap ?? '',
                'latitude' => $tower->latitude,
                'longitude' => $tower->longitude,
                'alamat_menara' => $tower->alamat_menara ?? '',
                'tinggi_menara' => $tower->tinggi_menara,
                'tinggi_bangunan' => $tower->tinggi_bangunan,
                'jumlah_pengguna' => $tower->jumlah_pengguna,
                'jumlah_kaki' => $tower->jumlah_kaki,
                'tower_type' => $tower->tower_type,
                'site_type' => $tower->site_type,
                'no_ijin' => $tower->no_ijin,
                'tanggal_ijin' => $this->formatDate($tower->tanggal_ijin),
                'berlaku_hingga' => $this->formatDate($tower->berlaku_hingga),
                'jenis_ijin' => $tower->jenis_ijin,
                'status' => $tower->status_ijin ?? '',
                'prs' => $tower->prs,
                'prs_id' => $tower->prs_id,
                'owner' => $displayOwner,
            ];
        });

        // Get towers for map display; apply the SAME filters (search + owner).
        // Coordinate filter:
        // - "with" and "all": show towers that have valid coordinates
        // - "without": map cannot show towers without coordinates → return empty set
        if ($coordFilter === 'without') {
            $mapTowers = collect();
        } else {
            $mapQuery = Tower::with(['owners:id,name'])
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->where('latitude', '!=', '')
                ->where('longitude', '!=', '')
                ->where('latitude', '!=', 0)
                ->where('longitude', '!=', 0);

            // Apply search filter to map as well
            if ($search) {
                $mapQuery->where(function ($q) use ($search) {
                    $q->where('site_name', 'like', "%{$search}%")
                      ->orWhere('alamat_menara', 'like', "%{$search}%")
                      ->orWhereHas('owners', function ($ownerQuery) use ($search) {
                          $ownerQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Apply owner filter to map
            if ($ownerFilter && $ownerFilter !== 'all') {
                $mapQuery->whereHas('owners', function ($q) use ($ownerFilter) {
                    $q->where('name', $ownerFilter);
                });
            }

            $mapTowers = $mapQuery->get()->map(function ($tower) use ($ownerFilter) {
                $ownerNames = $tower->owners->pluck('name');
                $displayOwner = $ownerFilter !== 'all' && $ownerNames->contains($ownerFilter)
                    ? $ownerFilter
                    : ($ownerNames->first() ?? '');
                return [
                    'id' => $tower->id,
                    'site_name' => $tower->site_name ?? '',
                    'site_id' => $tower->site_id ?? '',
                    'site_sap' => $tower->site_sap ?? '',
                    'latitude' => $tower->latitude,
                    'longitude' => $tower->longitude,
                    'alamat_menara' => $tower->alamat_menara ?? '',
                    'tinggi_menara' => $tower->tinggi_menara,
                    'tinggi_bangunan' => $tower->tinggi_bangunan,
                    'jumlah_pengguna' => $tower->jumlah_pengguna,
                    'jumlah_kaki' => $tower->jumlah_kaki,
                    'tower_type' => $tower->tower_type,
                    'site_type' => $tower->site_type,
                    'no_ijin' => $tower->no_ijin,
                    'tanggal_ijin' => $this->formatDate($tower->tanggal_ijin),
                    'berlaku_hingga' => $this->formatDate($tower->berlaku_hingga),
                    'jenis_ijin' => $tower->jenis_ijin,
                    'status' => $tower->status_ijin ?? '',
                    'prs' => $tower->prs,
                    'prs_id' => $tower->prs_id,
                    'owner' => $displayOwner,
                ];
            });
        }

        // Get all owners that have towers for filter dropdown
        $availableOwners = Owner::whereHas('towers')
                                ->orderBy('name')
                                ->pluck('name')
                                ->toArray();

        // Get total active tower count (not affected by pagination or filters)
        $totalActiveTowers = Tower::where('status_ijin', 'Aktif')->count();

        return Inertia::render('DataTower/Index', [
            'towers' => $towersData,
            'mapTowers' => $mapTowers,
            'availableOwners' => $availableOwners, // Add list of owners for filter
            'currentPage' => $towers->currentPage(),
            'perPage' => $towers->perPage(),
            'total' => $towers->total(),
            'lastPage' => $towers->lastPage(),
            'totalActiveTowers' => $totalActiveTowers, // Add total active tower count
        ]);
    }

    /**
     * Get all unique owners for filter dropdown
     */
    public function getOwners()
    {
        // Get only owners that have tower relationships
        $owners = Owner::whereHas('towers')
                      ->orderBy('name')
                      ->pluck('name');
        return response()->json($owners);
    }

    /**
     * Show tower detail page
     */
    public function show(Tower $tower)
    {
        $tower->load('owners');
        
        $user = auth()->user();
        $canSendFeedback = $user && !$user->isStaff();

        return Inertia::render('TowerDetail', [
            'tower' => $tower,
            'canSendFeedback' => $canSendFeedback,
        ]);
    }
}
