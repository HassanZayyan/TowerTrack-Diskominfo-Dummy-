<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Tower;

Route::get('/', function () {
    return redirect()->route('tower.map');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Public Routes
Route::get('/tower-map', function () {
    $search = request('search');
    $perPage = 10;
    
    $query = Tower::query()
        ->whereNotNull('latitude')
        ->whereNotNull('longitude');
    
    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('site_name', 'like', "%{$search}%")
              ->orWhere('alamat_menara', 'like', "%{$search}%");
        });
    }
    
    $totalTowers = $query->count();
    
    $towers = $query->select([
            'id',
            'site_name',
            'latitude',
            'longitude',
            'alamat_menara',
            'tinggi_menara',
            'site_type',
            'status_ijin as status' // Using status_ijin column and aliasing it as status
        ])
        ->orderBy('site_name')
        ->paginate($perPage);

    return Inertia::render('TowerMap', [
        'towers' => $towers->items(),
        'currentPage' => $towers->currentPage(),
        'perPage' => $perPage,
        'total' => $totalTowers,
    ]);
})->name('tower.map');

Route::get('/complaint', function () {
    // Get towers list for dropdown
    $towers = Tower::query()
        ->select(['id', 'site_name', 'alamat_menara'])
        ->orderBy('site_name')
        ->get();

    return Inertia::render('Complaint', [
        'towers' => $towers,
    ]);
})->name('complaint');

Route::post('/complaint', function () {
    request()->validate([
        'nama' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'telepon' => 'nullable|string|max:20',
        'kategori' => 'required|string|max:50',
        'lokasi_tower' => 'nullable|string|max:255',
        'pesan' => 'required|string|max:500',
        'foto.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120', // 5MB
    ]);
    
    // Here you would process the complaint
    // For now just return success
    return redirect()->back()->with('success', 'Keluhan berhasil dikirim');
})->name('complaint.store');

// Admin/Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::get('/map-tower', function () {
        $towers = Tower::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select(['id','site_name','latitude','longitude','alamat_menara','tinggi_menara','site_type'])
            ->get();

        return Inertia::render('MapTower', [
            'towers' => $towers,
        ]);
    })->name('map.tower');
});

require __DIR__.'/auth.php';
