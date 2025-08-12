<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Tower;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\StaffMiddleware;

Route::get('/', function () {
    return redirect()->route('data.tower');
});

Route::get('/dashboard', function () {
    return redirect()->route('admin.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Public Routes
Route::get('/data-tower', function () {
    $search = request('search');
    $coordFilter = request('coord', 'all'); // all | with | without
    $perPage = 10;

    $csvPath = base_path('Data_menara_rev.csv');
    if (!file_exists($csvPath)) {
        abort(500, 'CSV data file not found');
    }

    $handle = fopen($csvPath, 'r');
    if ($handle === false) {
        abort(500, 'Unable to open CSV data file');
    }

    $headers = fgetcsv($handle);
    $rows = [];
    $rowIndex = 0;
    while (($data = fgetcsv($handle)) !== false) {
        // Skip completely empty rows
        if ($data === null || (count($data) === 1 && trim((string)$data[0]) === '')) {
            continue;
        }

        // Some lines may not have the full number of columns; align safely
        if (is_array($headers)) {
            $rowAssoc = [];
            foreach ($headers as $i => $key) {
                $rowAssoc[$key] = $data[$i] ?? null;
            }
        } else {
            continue;
        }

        $siteName = trim((string)($rowAssoc['SITE NAME'] ?? ''));
        $owner = trim((string)($rowAssoc['OWNER'] ?? ''));
        $alamat = trim((string)($rowAssoc['ALAMAT MENARA'] ?? ''));
        $latRaw = trim((string)($rowAssoc['LATTITUDE'] ?? ''));
        $lonRaw = trim((string)($rowAssoc['LONGITUDE'] ?? ''));
        $heightRaw = trim((string)($rowAssoc['TINGGI MENARA (m)'] ?? ''));
        $siteType = trim((string)($rowAssoc['SITE TYPE'] ?? ''));
        $status = trim((string)($rowAssoc['STATUS IJIN'] ?? ''));

        $lat = is_numeric($latRaw) ? (float)$latRaw : null;
        $lon = is_numeric($lonRaw) ? (float)$lonRaw : null;
        $height = is_numeric($heightRaw) ? (float)$heightRaw : null;

        $rows[] = [
            'id' => (int)($rowAssoc['ID / NO URUT'] ?? (++$rowIndex)),
            'site_name' => $siteName,
            'latitude' => $lat ?? ($latRaw !== '' ? $latRaw : null),
            'longitude' => $lon ?? ($lonRaw !== '' ? $lonRaw : null),
            'alamat_menara' => $alamat,
            'tinggi_menara' => $height,
            'site_type' => $siteType,
            'owner' => $owner,
            'status' => $status,
        ];
    }

    fclose($handle);

    // Sort by site name for stable display
    usort($rows, function ($a, $b) {
        return strcasecmp((string)($a['site_name'] ?? ''), (string)($b['site_name'] ?? ''));
    });

    $hasCoords = function ($t) {
        $lat = $t['latitude'] ?? null;
        $lon = $t['longitude'] ?? null;
        return is_numeric($lat) && is_numeric($lon);
    };

    // Apply search to table data
    $filtered = array_values(array_filter($rows, function ($t) use ($search) {
        if (!$search) return true;
        $haystack = implode(' ', [
            (string)($t['site_name'] ?? ''),
            (string)($t['alamat_menara'] ?? ''),
            (string)($t['owner'] ?? ''),
        ]);
        return stripos($haystack, (string)$search) !== false;
    }));

    // Coordinate filter for table data
    if ($coordFilter === 'with') {
        $filtered = array_values(array_filter($filtered, $hasCoords));
    } elseif ($coordFilter === 'without') {
        $filtered = array_values(array_filter($filtered, function ($t) use ($hasCoords) { return !$hasCoords($t); }));
    }

    $total = count($filtered);
    $currentPage = max((int)request('page', 1), 1);
    $offset = ($currentPage - 1) * $perPage;
    $towersPage = array_slice($filtered, $offset, $perPage);
    $lastPage = max((int)ceil($total / $perPage), 1);

    // Map towers: show all with coordinates regardless of table filter/search
    $mapTowers = array_values(array_filter($rows, $hasCoords));

    return Inertia::render('DataTower', [
        'towers' => $towersPage,
        'mapTowers' => $mapTowers,
        'currentPage' => $currentPage,
        'perPage' => $perPage,
        'total' => $total,
        'lastPage' => $lastPage,
    ]);
})->name('data.tower');

Route::get('/complaint', function () {
    // Build full towers list from CSV so that even entries without coordinates are included
    $csvPath = base_path('Data_menara_rev.csv');
    $list = [];
    if (file_exists($csvPath)) {
        $handle = fopen($csvPath, 'r');
        $headers = fgetcsv($handle);
        while (($data = fgetcsv($handle)) !== false) {
            if (!$headers) continue;
            $row = [];
            foreach ($headers as $i => $key) {
                $row[$key] = $data[$i] ?? null;
            }
            $siteName = trim((string)($row['SITE NAME'] ?? ''));
            $alamat = trim((string)($row['ALAMAT MENARA'] ?? 'Alamat tidak tersedia'));
            if ($siteName === '') continue;
            // Try to map to DB tower id by site_name for report FK compatibility
            $dbId = Tower::where('site_name', $siteName)->value('id');
            $list[] = [
                'id' => $dbId ?? 0, // 0 if not found; ideally all are seeded
                'site_name' => $siteName,
                'alamat_menara' => $alamat !== '' ? $alamat : 'Alamat tidak tersedia',
            ];
        }
        fclose($handle);
        // Sort by site name
        usort($list, function ($a, $b) {
            return strcasecmp($a['site_name'], $b['site_name']);
        });
    } else {
        // Fallback to DB if CSV is missing
        $list = Tower::query()
            ->select(['id', 'site_name', 'alamat_menara'])
            ->orderBy('site_name')
            ->get()
            ->toArray();
    }

    return Inertia::render('Complaint', [
        'towers' => $list,
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

// Admin/Operator routes (staff)
Route::middleware(['auth', StaffMiddleware::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');

    // Users management
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');
    });

    // Complaints management
    Route::get('/complaints', [\App\Http\Controllers\Admin\ComplaintController::class, 'index'])->name('complaints.index');
    Route::post('/complaints/{report}/respond', [\App\Http\Controllers\Admin\ComplaintController::class, 'respond'])->name('complaints.respond');
    Route::put('/complaints/{report}', [\App\Http\Controllers\Admin\ComplaintController::class, 'updateStatus'])->name('complaints.updateStatus');

    // Tower management
    Route::get('/towers', [\App\Http\Controllers\Admin\TowerController::class, 'index'])->name('towers.index');
    Route::put('/towers/{tower}', [\App\Http\Controllers\Admin\TowerController::class, 'update'])->name('towers.update');
});

require __DIR__.'/auth.php';
