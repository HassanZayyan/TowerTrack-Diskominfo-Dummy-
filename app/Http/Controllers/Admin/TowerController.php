<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use App\Models\Owner;
use App\Imports\TowersImport;
use App\Imports\TowersTemplateExport;
use App\Helpers\ExcelHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TowerController extends Controller
{
    /**
     * Normalize incoming tower payload: convert empty strings to null for nullable numeric/date fields
     * and properly format coordinates
     */
    protected function normalizeTowerInput(array $input): array
    {
        $nullableNumericFields = [
            'latitude', 'longitude', 'tinggi_menara', 'tinggi_bangunan', 'jumlah_pengguna', 'jumlah_kaki'
        ];
        $nullableDateFields = ['tanggal_ijin', 'berlaku_hingga'];

        foreach ($nullableNumericFields as $field) {
            if (array_key_exists($field, $input)) {
                if ($input[$field] === '' || $input[$field] === null) {
                    $input[$field] = null;
                } else {
                    // For coordinate fields, ensure proper formatting
                    if (in_array($field, ['latitude', 'longitude'])) {
                        $input[$field] = $this->formatCoordinate($input[$field]);
                    }
                }
            }
        }
        
        foreach ($nullableDateFields as $field) {
            if (array_key_exists($field, $input) && ($input[$field] === '' || $input[$field] === null)) {
                $input[$field] = null;
            }
        }

        return $input;
    }

    /**
     * Format coordinate value to ensure proper decimal precision
     */
    protected function formatCoordinate($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Convert to float and round to 8 decimal places
        $floatValue = (float) $value;
        
        // Check if the value is within valid ranges
        if (strpos($value, 'latitude') !== false || strpos($value, 'longitude') !== false) {
            // This is a field name, not a value
            return $floatValue;
        }
        
        return round($floatValue, 8);
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
            'latitude' => 'nullable|numeric|between:-90,90|regex:/^-?\d{1,3}(\.\d{1,8})?$/',
            'longitude' => 'nullable|numeric|between:-180,180|regex:/^-?\d{1,3}(\.\d{1,8})?$/',
            
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
        
        $validated = $request->validate($rules, [
            'latitude.regex' => 'Format latitude tidak valid. Gunakan format: -90.00000000 hingga 90.00000000 (maksimal 8 digit desimal)',
            'longitude.regex' => 'Format longitude tidak valid. Gunakan format: -180.00000000 hingga 180.00000000 (maksimal 8 digit desimal)',
            'latitude.between' => 'Latitude harus antara -90 dan 90 derajat',
            'longitude.between' => 'Longitude harus antara -180 dan 180 derajat',
        ]);

        // Handle owner selection
        $ownerId = null;
        
        // For tower owners, force them to use their own owner record
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $ownerId = auth()->user()->owner_id;
        } else {
            // For admin/operator, validate that selected owner exists
            if (!empty($validated['owner_id'])) {
                $ownerId = (int) $validated['owner_id'];
                
                // Validate that the owner exists
                if (!Owner::where('id', $ownerId)->exists()) {
                    return back()->withErrors(['owner_id' => 'Owner yang dipilih tidak ditemukan.']);
                }
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
            'latitude' => 'nullable|numeric|between:-90,90|regex:/^-?\d{1,3}(\.\d{1,8})?$/',
            'longitude' => 'nullable|numeric|between:-180,180|regex:/^-?\d{1,3}(\.\d{1,8})?$/',
            
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
        ], [
            'latitude.regex' => 'Format latitude tidak valid. Gunakan format: -90.00000000 hingga 90.00000000 (maksimal 8 digit desimal)',
            'longitude.regex' => 'Format longitude tidak valid. Gunakan format: -180.00000000 hingga 180.00000000 (maksimal 8 digit desimal)',
            'latitude.between' => 'Latitude harus antara -90 dan 90 derajat',
            'longitude.between' => 'Longitude harus antara -180 dan 180 derajat',
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
                if (!empty($validated['owner_id'])) {
                    $ownerId = (int) $validated['owner_id'];
                    
                    // Validate that the owner exists
                    if (!Owner::where('id', $ownerId)->exists()) {
                        return back()->withErrors(['owner_id' => 'Owner yang dipilih tidak ditemukan.']);
                    }
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

    /**
     * Show import form
     */
    public function showImportForm(): Response
    {
        // Get available owners (filtered for tower owners)
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            $owners = Owner::where('id', auth()->user()->owner_id)->orderBy('name')->get();
        } else {
            $owners = Owner::orderBy('name')->get();
        }

        return Inertia::render('Admin/TowerImport', [
            'templateUrl' => route('admin.towers.import.template'),
            'availableOwners' => $owners->map(function ($owner) {
                return [
                    'id' => $owner->id,
                    'name' => $owner->name,
                ];
            }),
        ]);
    }

    /**
     * Preview import (before actual import)
     * DRY: Uses ExcelHelper for header detection
     */
    public function previewImport(Request $request): JsonResponse
    {
        $validated = $request->validate(
            ExcelHelper::getFileValidationRules(),
            ExcelHelper::getFileValidationMessages()
        );

        try {
            // Use ExcelHelper to find header row
            $headerResult = ExcelHelper::findHeaderRow($validated['file'], ['alamat', 'menara', 'tower', 'site']);
            $headerRow = $headerResult['cleanedHeaderRow'];
            $headerRowIndex = $headerResult['headerRowIndex'];
            
            // Auto-detect mapping
            $import = new TowersImport();
            $detectedMapping = $import->detectColumnMapping($headerRow);
            
            // Validate required columns
            $requiredColumns = ['alamat_menara'];
            $missingColumns = array_diff($requiredColumns, array_keys($detectedMapping));
            
            // Preview data (10 rows)
            $previewData = Excel::toArray(new TowersImport(), $validated['file']);
            $preview = array_slice($previewData[0] ?? [], ($headerRowIndex ?? 0) + 1, 10);
            
            // Validate preview rows
            $errors = [];
            foreach ($preview as $index => $row) {
                $rowErrors = [];
                // Excel::toArray with WithHeadingRow uses original header as key, but Laravel Excel normalizes it
                if (isset($detectedMapping['alamat_menara'])) {
                    // Normalize header name to match how Laravel Excel creates keys
                    $headerKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $detectedMapping['alamat_menara'])));
                    $headerKey = preg_replace('/_+/', '_', $headerKey);
                    // Also try original header name
                    $value = $row[$headerKey] ?? $row[$detectedMapping['alamat_menara']] ?? null;
                    if (empty($value) || trim($value) === '' || trim($value) === '-') {
                        $rowErrors[] = 'Alamat Menara wajib diisi';
                    }
                } else {
                    // If mapping not found, try common variations
                    $value = $row['alamat_menara'] ?? $row['alamat menara'] ?? $row['alamat'] ?? null;
                    if (empty($value) || trim($value) === '' || trim($value) === '-') {
                        $rowErrors[] = 'Alamat Menara wajib diisi';
                    }
                }
                if (!empty($rowErrors)) {
                    $errors[] = [
                        'row' => $index + 2, // +2 karena header + 1-based
                        'errors' => $rowErrors
                    ];
                }
            }
            
            $totalRows = count($previewData[0] ?? []) - ($headerRowIndex ?? 0) - 1;
            
            return response()->json([
                'success' => true,
                'detected_mapping' => $detectedMapping,
                'missing_columns' => array_values($missingColumns),
                'preview' => $preview,
                'errors' => $errors,
                'can_import' => empty($missingColumns) && empty($errors),
                'total_rows' => max(0, $totalRows),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error previewing tower import', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membaca file: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Process import
     */
    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240', // Excel only (template required)
            'mode' => 'required|in:insert,update,upsert',
            'owner_id' => 'nullable|exists:owners,id',
            'column_mapping' => 'nullable|array', // Manual mapping jika perlu
        ]);

        try {
            $ownerId = auth()->user()->role === 'tower_owner' 
                ? auth()->user()->owner_id 
                : $validated['owner_id'] ?? null;

            $columnMapping = $validated['column_mapping'] ?? [];
            
            $import = new TowersImport($validated['mode'], $ownerId, $columnMapping);
            
            Excel::import($import, $validated['file']);

            $successCount = $import->getRowCount() - count($import->failures());
            $errorCount = count($import->failures());

            $message = "Import berhasil: {$successCount} data berhasil diimport";
            if ($errorCount > 0) {
                $message .= ", {$errorCount} data gagal";
            }

            return redirect()
                ->route('admin.towers.index')
                ->with([
                    'success' => $message,
                    'import_errors' => $import->failures(),
                    'error_count' => $errorCount,
                ]);
        } catch (\Exception $e) {
            \Log::error('Error importing towers', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['file' => 'Import gagal: ' . $e->getMessage()]);
        }
    }

    /**
     * Download template
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        return Excel::download(new TowersTemplateExport(), 'template_import_tower_' . date('Ymd_His') . '.xlsx');
    }

    /**
     * Get available owners (helper method)
     */
    protected function getAvailableOwners()
    {
        if (auth()->user() && auth()->user()->role === 'tower_owner') {
            return Owner::where('id', auth()->user()->owner_id)->orderBy('name')->get();
        }
        return Owner::orderBy('name')->get();
    }
}


