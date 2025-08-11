<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Tower;

Route::get('/', function () {
    return redirect()->route('data.tower');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Public Routes
Route::get('/data-tower', function () {
    $search = request('search');
    $perPage = 10;
    
    // Base query for both map and table
    $baseQuery = Tower::query()
        ->whereNotNull('latitude')
        ->whereNotNull('longitude');
    
    // Apply search filter to the paginated table query
    $tableQuery = clone $baseQuery;
    if ($search) {
        $tableQuery->where(function ($q) use ($search) {
            $q->where('site_name', 'like', "%{$search}%")
              ->orWhere('alamat_menara', 'like', "%{$search}%");
        });
    }
    
    $totalTowers = $tableQuery->count();
    
    // Get paginated towers for table display with available fields
    $paginatedTowers = $tableQuery->select([
            'id',
            'site_name',
            'site_id',
            'site_sap',
            'latitude',
            'longitude',
            'tinggi_menara',
            'tinggi_bangunan',
            'jumlah_pengguna',
            'jumlah_kaki',
            'alamat_menara',
            'tower_type',
            'site_type',
            'no_ijin',
            'tanggal_ijin',
            'berlaku_hingga',
            'jenis_ijin',
            'status_ijin as status', // Using status_ijin column and aliasing it as status
            'prs'
        ])
        ->orderBy('site_name')
        ->paginate($perPage);
    
    // Get all towers with coordinates for map display with available fields
    $allMapTowers = $baseQuery->select([
            'id',
            'site_name',
            'site_id',
            'site_sap',
            'latitude',
            'longitude',
            'tinggi_menara',
            'tinggi_bangunan',
            'jumlah_pengguna',
            'jumlah_kaki',
            'alamat_menara',
            'tower_type',
            'site_type',
            'no_ijin',
            'tanggal_ijin',
            'berlaku_hingga',
            'jenis_ijin',
            'status_ijin as status',
            'prs'
        ])
        ->get();

    return Inertia::render('DataTower', [
        'towers' => $paginatedTowers->items(),
        'mapTowers' => $allMapTowers,
        'currentPage' => $paginatedTowers->currentPage(),
        'perPage' => $perPage,
        'total' => $totalTowers,
        'lastPage' => $paginatedTowers->lastPage(),
    ]);
})->name('data.tower');

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
        'telepon' => 'required|string|max:20',
        'kategori' => 'required|string|max:100',
        'lokasi_tower' => 'required|string|max:255',
        'tower_id' => 'required|exists:towers,id',
        'pesan' => 'required|string|max:500',
        'foto.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120', // 5MB
    ]);
    
    // Simpan data report ke database
    $report = \App\Models\Report::create([
        'tower_id' => request('tower_id'), // Use tower_id for foreign key
        'reporter_name' => request('nama'),
        'reporter_email' => request('email'),
        'reporter_phone' => request('telepon'),
        'category' => request('kategori'),
        'message' => request('pesan'),
        'status' => 'pending', // Status default
    ]);
    
    // Upload dan simpan foto jika ada
    if (request()->hasFile('foto')) {
        foreach (request()->file('foto') as $photo) {
            $path = $photo->store('report-photos', 'public');
            
            \App\Models\ReportImage::create([
                'report_id' => $report->id,
                'image_path' => $path,
            ]);
        }
    }
    
    return redirect()->back()->with('success', 'Keluhan berhasil dikirim');
})->name('complaint.store');

// Admin/Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
