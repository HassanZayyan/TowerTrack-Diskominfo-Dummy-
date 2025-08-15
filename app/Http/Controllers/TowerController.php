<?php

namespace App\Http\Controllers;

use App\Models\Owner;
use App\Models\Tower;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TowerController extends Controller
{
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
                  ->where('longitude', '!=', '');
        } elseif ($coordFilter === 'without') {
            $query->where(function ($q) {
                $q->whereNull('latitude')
                  ->orWhereNull('longitude')
                  ->orWhere('latitude', '')
                  ->orWhere('longitude', '');
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

        // Transform the data to match frontend expectations
        $towersData = $towers->map(function ($tower) use ($ownerFilter) {
            // If filtered by a specific owner, show that owner explicitly when present
            $ownerNames = $tower->owners->pluck('name');
            $displayOwner = $ownerFilter !== 'all' && $ownerNames->contains($ownerFilter)
                ? $ownerFilter
                : ($ownerNames->first() ?? '');

            return [
                'id' => $tower->id,
                'site_name' => $tower->site_name ?? '',
                'latitude' => $tower->latitude,
                'longitude' => $tower->longitude,
                'alamat_menara' => $tower->alamat_menara ?? '',
                'tinggi_menara' => $tower->tinggi_menara,
                'site_type' => $tower->site_type,
                'owner' => $displayOwner,
                'status' => $tower->status_ijin ?? '',
            ];
        });

        // Get towers for map display; apply owner filter as well so peta selaras dengan tabel
        $mapQuery = Tower::with(['owners:id,name'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('latitude', '!=', '')
            ->where('longitude', '!=', '');

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
                'latitude' => $tower->latitude,
                'longitude' => $tower->longitude,
                'alamat_menara' => $tower->alamat_menara ?? '',
                'tinggi_menara' => $tower->tinggi_menara,
                'site_type' => $tower->site_type,
                'owner' => $displayOwner,
                'status' => $tower->status_ijin ?? '',
            ];
        });

        // Get all owners that have towers for filter dropdown
        $availableOwners = Owner::whereHas('towers')
                                ->orderBy('name')
                                ->pluck('name')
                                ->toArray();

        return Inertia::render('DataTower/Index', [
            'towers' => $towersData,
            'mapTowers' => $mapTowers,
            'availableOwners' => $availableOwners, // Add list of owners for filter
            'currentPage' => $towers->currentPage(),
            'perPage' => $towers->perPage(),
            'total' => $towers->total(),
            'lastPage' => $towers->lastPage(),
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
