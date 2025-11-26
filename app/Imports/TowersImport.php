<?php

namespace App\Imports;

use App\Models\Tower;
use App\Models\Owner;
use App\Traits\BaseImportTrait;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithProgressBar;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterImport;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class TowersImport implements 
    ToModel, 
    WithHeadingRow, 
    WithValidation,
    WithBatchInserts,
    WithChunkReading,
    SkipsOnFailure,
    WithEvents
{
    use SkipsFailures, BaseImportTrait;

    protected $mode; // 'insert', 'update', 'upsert'
    protected $ownerId; // For tower_owner role
    protected $columnMapping = []; // Auto-detected mapping
    protected $rowCount = 0;
    protected $towersToAttachOwner = []; // Store towers that need owner attachment after batch insert

    /**
     * Column mappings - support various column name variations
     * Enhanced to handle template headers with units like "Tinggi Menara (m)"
     */
    protected $columnMappings = [
        'alamat_menara' => [
            'alamat_menara', 'alamat menara', 'alamat', 
            'address', 'lokasi', 'alamat tower', 'alamat_tower',
            'alamat_owner' // Handle ALAMAT OWNER column
        ],
        'site_name' => [
            'site_name', 'site name', 'nama site', 
            'name', 'nama', 'site', 'nama_tower'
        ],
        'site_id' => [
            'site_id', 'site id', 'id site', 
            'id', 'siteid', 'kode_site'
        ],
        'site_sap' => [
            'site_sap', 'site sap', 'sap', 
            'sap_id', 'sapid'
        ],
        'latitude' => [
            'latitude', 'lat', 'lintang', 
            'koordinat_lat', 'lat.', 'y', 'koordinat_latitude',
            'lattitude', 'latt' // Handle typo in CSV header (LATTITUDE with double T)
        ],
        'longitude' => [
            'longitude', 'lng', 'long', 'bujur',
            'koordinat_lng', 'lng.', 'x', 'koordinat_longitude'
        ],
        'tinggi_menara' => [
            'tinggi_menara', 'tinggi menara', 'tinggi', 
            'height', 'tinggi_tower', 'tinggi tower',
            'tinggi_menara_(m)', 'tinggi menara (m)', // Handle template header with unit
            'tinggi_menara_m', 'tinggi menara m'
        ],
        'tinggi_bangunan' => [
            'tinggi_bangunan', 'tinggi bangunan', 
            'building_height', 'tinggi_building',
            'tinggi_bangunan_(m)', 'tinggi bangunan (m)', // Handle template header with unit
            'tinggi_bangunan_m', 'tinggi bangunan m'
        ],
        'jumlah_pengguna' => [
            'jumlah_pengguna', 'jumlah pengguna', 
            'users', 'pengguna', 'jumlah_users'
        ],
        'jumlah_kaki' => [
            'jumlah_kaki', 'jumlah kaki', 
            'legs', 'kaki', 'jumlah_legs'
        ],
        'tower_type' => [
            'tower_type', 'tower type', 'tipe tower', 
            'type', 'tipe', 'jenis_tower'
        ],
        'site_type' => [
            'site_type', 'site type', 'tipe site', 
            'site_type', 'tipe_site'
        ],
        'owner_name' => [
            'owner', 'pemilik', 'owner_name', 
            'nama owner', 'nama_pemilik', 'pemilik_tower', 'owner name'
        ],
        'status_ijin' => [
            'status_ijin', 'status ijin', 'status', 
            'permit_status', 'status_permit'
        ],
        'no_ijin' => [
            'no_ijin', 'no ijin', 'nomor ijin', 
            'permit_number', 'nomor_permit', 'no_permit'
        ],
        'tanggal_ijin' => [
            'tanggal_ijin', 'tanggal ijin', 
            'permit_date', 'tanggal_permit', 'date_permit',
            'tanggal_ijin_(yyyy-mm-dd)', 'tanggal ijin (yyyy-mm-dd)', // Handle template header
            'tanggal_ijin_yyyy-mm-dd', 'tanggal ijin yyyy-mm-dd'
        ],
        'berlaku_hingga' => [
            'berlaku_hingga', 'berlaku hingga', 
            'expiry_date', 'expires', 'valid_until',
            'berlaku_hingga_(yyyy-mm-dd)', 'berlaku hingga (yyyy-mm-dd)', // Handle template header
            'berlaku_hingga_yyyy-mm-dd', 'berlaku hingga yyyy-mm-dd'
        ],
        'jenis_ijin' => [
            'jenis_ijin', 'jenis ijin', 
            'permit_type', 'jenis_permit', 'type_permit'
        ],
        'prs' => [
            'prs', 'prs_name', 'nama_prs'
        ],
        'prs_id' => [
            'prs_id', 'prs id', 'id_prs'
        ],
    ];

    public function __construct($mode = 'insert', $ownerId = null, $columnMapping = [])
    {
        $this->mode = $mode;
        $this->ownerId = $ownerId;
        $this->columnMapping = $columnMapping;
    }

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        $this->rowCount++;

        // Normalize row (handle various column names)
        $normalizedRow = $this->normalizeRow($row);
        
        // Map to database fields
        $data = $this->mapToDatabaseFields($normalizedRow);
        
        // Normalize data (mirip normalizeTowerInput)
        $data = $this->normalizeTowerData($data);
        
        // Handle owner assignment
        $data = $this->handleOwner($data, $normalizedRow);
        
        // Store original data (before filtering) for owner lookup in insert mode
        $originalDataForOwner = $data;
        
        // Remove non-database fields before creating model
        $data = $this->filterValidFields($data);
        
        // Mode handling - pass original data for owner lookup
        return $this->handleMode($data, $originalDataForOwner);
    }

    // normalizeRow() moved to BaseImportTrait

    /**
     * Map normalized row to database fields
     * FIXED: Always include all expected fields (even if null) to ensure normalization runs
     */
    protected function mapToDatabaseFields(array $normalizedRow): array
    {
        // Get list of all database fields that should be normalized
        $expectedFields = [
            'site_id', 'site_sap', 'site_name', 'longitude', 'latitude',
            'tinggi_menara', 'tinggi_bangunan', 'jumlah_pengguna', 'jumlah_kaki',
            'alamat_menara', 'tower_type', 'site_type', 'no_ijin',
            'tanggal_ijin', 'berlaku_hingga', 'jenis_ijin', 'status_ijin',
            'prs', 'prs_id', 'owner_name'
        ];
        
        $data = [];

        // Always include all expected fields, even if value is null
        // This ensures normalization can process empty values (convert empty strings/dashes to null)
        foreach ($expectedFields as $dbField) {
            if (isset($this->columnMappings[$dbField])) {
                $value = $this->getValue($normalizedRow, $this->columnMappings[$dbField]);
                // Always set the field, even if null - normalization will handle empty values
                $data[$dbField] = $value;
            }
        }

        return $data;
    }

    // getValue() moved to BaseImportTrait

    /**
     * Normalize tower data using generic normalizeData() from BaseImportTrait
     * FIXED: Ensure all nullable fields are properly normalized
     */
    protected function normalizeTowerData(array $data): array
    {
        // Use generic normalizeData() from BaseImportTrait
        // This will convert empty strings, dashes, and invalid values to null for nullable fields
        return $this->normalizeData($data, [
            'coordinateFields' => ['latitude', 'longitude'],
            'numericFields' => ['tinggi_menara', 'tinggi_bangunan'],
            'integerFields' => ['jumlah_pengguna', 'jumlah_kaki'],
            'dateFields' => ['tanggal_ijin', 'berlaku_hingga'],
            // Also normalize string fields that might be empty
            'stringFields' => [
                'site_id', 'site_sap', 'site_name', 'alamat_menara', 
                'tower_type', 'site_type', 'no_ijin', 'jenis_ijin', 
                'status_ijin', 'prs', 'prs_id', 'owner_name'
            ],
        ]);
    }

    /**
     * Filter only valid database fields for Tower model
     */
    protected function filterValidFields(array $data): array
    {
        // List of valid fields in towers table (excluding timestamps which are auto-managed)
        $validFields = [
            'site_id', 'site_sap', 'site_name', 'longitude', 'latitude',
            'tinggi_menara', 'tinggi_bangunan', 'jumlah_pengguna', 'jumlah_kaki',
            'alamat_menara', 'tower_type', 'site_type', 'no_ijin',
            'tanggal_ijin', 'berlaku_hingga', 'jenis_ijin', 'status_ijin',
            'prs', 'prs_id'
        ];
        
        // Only keep valid fields (this will automatically remove _owner_name and other non-database fields)
        $filtered = [];
        foreach ($validFields as $field) {
            if (array_key_exists($field, $data)) {
                $filtered[$field] = $data[$field];
            }
        }
        
        // Explicitly remove any remaining non-database fields (extra safety)
        $nonDatabaseFields = ['_owner_name', '_original_row', '_row_index'];
        foreach ($nonDatabaseFields as $field) {
            unset($filtered[$field]);
        }
        
        return $filtered;
    }

    // formatCoordinate() moved to BaseImportTrait

    // parseDate() moved to BaseImportTrait

    /**
     * Handle owner assignment
     */
    protected function handleOwner(array $data, array $normalizedRow): array
    {
        // Store owner_name for later use in attachOwner
        if (isset($data['owner_name'])) {
            $data['_owner_name'] = $data['owner_name'];
            unset($data['owner_name']); // Remove from data array
        }

        return $data;
    }

    /**
     * Handle import mode
     */
    protected function handleMode(array $data, array $originalDataForOwner = null)
    {
        // Ensure alamat_menara is set (required field)
        if (empty($data['alamat_menara'])) {
            return null; // Skip this row
        }

        // Use original data for owner lookup if provided, otherwise use filtered data
        $ownerData = $originalDataForOwner ?? $data;

        if ($this->mode === 'upsert') {
            // Use site_id or site_sap as unique key
            $uniqueKey = $data['site_id'] ?? $data['site_sap'] ?? null;
            
            if ($uniqueKey) {
                $tower = Tower::updateOrCreate(
                    ['site_id' => $uniqueKey],
                    $data
                );
                
                // Handle owner relationship
                $this->attachOwner($tower, $ownerData);
                
                return $tower;
            }
        } elseif ($this->mode === 'update') {
            $uniqueKey = $data['site_id'] ?? $data['site_sap'] ?? null;
            
            if ($uniqueKey) {
                $tower = Tower::where('site_id', $uniqueKey)
                    ->orWhere('site_sap', $uniqueKey)
                    ->first();
                
                if ($tower) {
                    $tower->update($data);
                    $this->attachOwner($tower, $ownerData);
                    return $tower;
                }
            }
            return null; // Skip if not found
        }

        // Insert mode (default)
        // Don't save manually - let Laravel Excel handle batch insert
        // Store owner data to attach after batch insert completes
        
        // Ensure $data only contains fillable fields (extra safety)
        // IMPORTANT: For batch insert, ALL models must have the SAME fields
        // So we include ALL fillable fields, even if value is null
        $fillableFields = (new Tower())->getFillable();
        $filteredData = [];
        foreach ($fillableFields as $field) {
            // Always include the field, even if not in $data (will be null)
            // This ensures all models have the same structure for batch insert
            $filteredData[$field] = $data[$field] ?? null;
        }
        
        $tower = new Tower($filteredData);
        
        // Store owner data for later attachment (after batch insert)
        // Use original data (before filtering) for owner lookup to preserve _owner_name
        if ($this->ownerId || (isset($ownerData['_owner_name']) && !empty($ownerData['_owner_name']))) {
            $this->towersToAttachOwner[] = [
                'tower' => $tower,
                'data' => $ownerData // Store original data (with _owner_name) for owner lookup
            ];
        }
        
        return $tower;
    }

    /**
     * Attach owner to tower
     */
    protected function attachOwner(Tower $tower, array $data): void
    {
        // If ownerId is set (for tower_owner role), use it
        if ($this->ownerId) {
            if (!$tower->owners()->where('owners.id', $this->ownerId)->exists()) {
                $tower->owners()->attach($this->ownerId);
            }
        } elseif (isset($data['_owner_name']) && !empty($data['_owner_name'])) {
            // Try to find owner by name
            $owner = Owner::where('name', $data['_owner_name'])->first();
            if ($owner && !$tower->owners()->where('owners.id', $owner->id)->exists()) {
                $tower->owners()->attach($owner->id);
            }
        }
    }

    /**
     * Auto-detect column mapping from headers
     */
    // detectColumnMapping() moved to BaseImportTrait

    /**
     * Get row count
     */
    public function getRowCount(): int
    {
        return $this->rowCount;
    }

    public function rules(): array
    {
        return [
            'alamat_menara' => 'required',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ];
    }

    public function batchSize(): int
    {
        return 500;
    }

    public function chunkSize(): int
    {
        return 500;
    }

    /**
     * Register events
     */
    public function registerEvents(): array
    {
        return [
            AfterImport::class => function(AfterImport $event) {
                // After batch insert completes, attach owners to towers
                $this->attachOwnersAfterImport();
            },
        ];
    }

    /**
     * Attach owners to towers after batch insert completes
     */
    protected function attachOwnersAfterImport(): void
    {
        foreach ($this->towersToAttachOwner as $item) {
            $data = $item['data'];
            
            // Find tower by site_id or site_sap (most reliable)
            $uniqueKey = $data['site_id'] ?? $data['site_sap'] ?? null;
            $tower = null;
            
            if ($uniqueKey) {
                $tower = Tower::where('site_id', $uniqueKey)
                    ->orWhere('site_sap', $uniqueKey)
                    ->orderBy('created_at', 'desc') // Get most recent if multiple matches
                    ->first();
            }
            
            // Fallback: Find by alamat_menara and site_name
            if (!$tower && !empty($data['alamat_menara'])) {
                $query = Tower::where('alamat_menara', $data['alamat_menara']);
                if (!empty($data['site_name'])) {
                    $query->where('site_name', $data['site_name']);
                }
                // Also check created_at is recent (within last 5 minutes) to avoid matching old records
                $query->where('created_at', '>=', now()->subMinutes(5))
                      ->orderBy('created_at', 'desc'); // Get most recent
                $tower = $query->first();
            }
            
            if ($tower) {
                // Attach owner - this will use $this->ownerId if set, or _owner_name from $data
                $this->attachOwner($tower, $data);
            }
        }
        
        // Clear the array
        $this->towersToAttachOwner = [];
    }
}

