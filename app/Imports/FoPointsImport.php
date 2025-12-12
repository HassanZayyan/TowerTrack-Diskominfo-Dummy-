<?php

namespace App\Imports;

use App\Models\FoPoint;
use App\Models\FoRoute;
use App\Models\FoProvider;
use App\Traits\BaseImportTrait;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterImport;

class FoPointsImport implements 
    ToModel, 
    WithHeadingRow, 
    WithStartRow,
    WithValidation,
    WithBatchInserts,
    WithChunkReading,
    SkipsOnFailure,
    WithEvents
{
    use SkipsFailures, BaseImportTrait;

    protected $mode; // 'insert', 'update', 'upsert'
    protected $defaultRouteId; // Default route if route_name not found
    protected $autoCreateRoutes; // Auto-create route if not exists
    protected $columnMapping = [];
    protected $rowCount = 0;
    protected $startRow = 1; // Default start from row 1, can be overridden
    protected $pointsToAttachProvider = []; // Store points that need provider attachment after batch insert
    protected $columnIndexMapping = []; // Store column index mapping for CSV with empty leading columns

    /**
     * Column mappings - support various column name variations
     */
    protected $columnMappings = [
        'name' => [
            'name', 'nama', 'nama lokasi', 
            'location', 'nama_titik', 'nama titik', 'lokasi'
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
        'coordinates' => [
            'koordinat', 'coordinates', 'coordinate',
            'koordinat_lengkap', 'lat_lng', 'lat,lng'
        ],
        'route_name' => [
            'route_name', 'route name', 'route', 
            'jalur', 'nama_route', 'nama route', 'jalur_fo'
        ],
        'sequence_number' => [
            'sequence_number', 'sequence number', 'sequence', 
            'urutan', 'nomor_urutan', 'nomor urutan', 'seq', 'no'
        ],
        'type' => [
            'type', 'tipe', 'jenis', 
            'point_type', 'tipe_titik', 'jenis_titik'
        ],
        'status' => [
            'status', 'status_point', 
            'status titik', 'status_titik'
        ],
        'side_of_road' => [
            'side_of_road', 'side of road', 
            'sisi_jalan', 'sisi jalan', 'side'
        ],
        'description' => [
            'description', 'deskripsi', 
            'keterangan', 'catatan', 'notes'
        ],
        'area' => [
            'area', 'wilayah', 'daerah'
        ],
        'isp_image' => [
            'isp_image', 'isp image', 
            'gambar_isp', 'gambar isp', 'link_isp', 'link isp'
        ],
        'pole_image' => [
            'pole_image', 'pole image', 
            'gambar_tiang', 'gambar tiang', 'link_tiang', 'link tiang'
        ],
        'junction_box_image' => [
            'junction_box_image', 'junction box image', 
            'gambar_jb', 'gambar jb', 'gambar_junction', 
            'link_jb', 'link jb', 'junction_box'
        ],
        'providers' => [
            'providers', 'provider', 'pemilik', 
            'owner', 'isp', 'provider_name', 'nama_provider'
        ],
    ];

    public function __construct(
        $mode = 'insert', 
        $defaultRouteId = null, 
        $autoCreateRoutes = false,
        $columnMapping = [],
        $startRow = null,
        $columnIndexMapping = []
    ) {
        $this->mode = $mode;
        $this->defaultRouteId = $defaultRouteId;
        $this->autoCreateRoutes = $autoCreateRoutes;
        $this->columnMapping = $columnMapping;
        $this->columnIndexMapping = $columnIndexMapping; // Store column index mapping
        if ($startRow !== null) {
            $this->startRow = $startRow;
        }
    }

    /**
     * Specify which row to start reading from (1-based)
     * WithHeadingRow will use this row as the header row
     */
    public function startRow(): int
    {
        return $this->startRow;
    }

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // Store original row for fallback mapping (CSV with empty leading columns)
        $originalRow = $row;
        
        // Normalize row
        $normalizedRow = $this->normalizeRow($row);
        
        // Map to database fields (pass original row for fallback)
        $data = $this->mapToDatabaseFields($normalizedRow, $originalRow);
        
        // Handle coordinates (support "lat,lng" format)
        $data = $this->handleCoordinates($data, $normalizedRow);
        
        // If coordinates still not found and we have columnIndexMapping, try direct access
        if ((empty($data['latitude']) || empty($data['longitude'])) && !empty($this->columnIndexMapping['coordinates'])) {
            $coordsIndex = $this->columnIndexMapping['coordinates'];
            // Try to get coordinates from original row by index
            // $originalRow might be associative, so try both ways
            $coordsValue = null;
            if (isset($originalRow[$coordsIndex])) {
                $coordsValue = $originalRow[$coordsIndex];
            } else {
                // Convert to array and access by index
                $rowArray = is_array($originalRow) ? array_values($originalRow) : [];
                if (isset($rowArray[$coordsIndex])) {
                    $coordsValue = $rowArray[$coordsIndex];
                }
            }
            
            if ($coordsValue) {
                $coords = $this->parseCoordinates($coordsValue);
                if ($coords['latitude'] !== null && $coords['longitude'] !== null) {
                    $data['latitude'] = $coords['latitude'];
                    $data['longitude'] = $coords['longitude'];
                }
            }
        }
        
        // Normalize data
        $data = $this->normalizeFoPointData($data);
        
        // Handle route
        $data = $this->handleRoute($data);
        
        // Extract providers (will be handled separately)
        $providers = $this->extractProviders($normalizedRow);
        unset($data['providers']);
        
        // Store original data for provider lookup
        $originalDataForProvider = $data;
        
        // Mode handling
        $point = $this->handleMode($data, $originalDataForProvider, $providers);
        
        // Only increment rowCount if point was created (not null)
        if ($point !== null) {
            $this->rowCount++;
        } else {
            // Log why row was skipped (only log first few to avoid spam)
            if ($this->rowCount < 5) {
                \Log::debug('FO Points Import - Row skipped', [
                    'row_data' => $data,
                    'normalized_row_keys' => array_keys($normalizedRow),
                    'original_row_keys' => array_keys($originalRow),
                    'column_index_mapping' => $this->columnIndexMapping,
                    'missing_fields' => [
                        'name' => empty($data['name']),
                        'latitude' => empty($data['latitude']),
                        'longitude' => empty($data['longitude']),
                    ],
                ]);
            }
        }
        
        return $point;
    }

    /**
     * Normalize row keys
     * Handles empty/null keys from CSV files with empty leading columns
     * For CSV with empty leading columns, we need to reconstruct the row using column index mapping
     */
    protected function normalizeRow(array $row): array
    {
        $normalized = [];
        
        // If we have columnIndexMapping, use it to reconstruct the row
        // This handles CSV with empty leading columns where WithHeadingRow creates empty keys
        if (!empty($this->columnIndexMapping)) {
            // Reconstruct row using column index mapping
            foreach ($this->columnIndexMapping as $dbField => $index) {
                if (isset($row[$index])) {
                    // Use the index as key temporarily, we'll normalize it
                    $normalized[$index] = $row[$index];
                }
            }
            
            // Also try to normalize by key (for cases where key is not empty)
            foreach ($row as $key => $value) {
                if (!empty(trim($key ?? '')) && $key !== null) {
                    $normalKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $key)));
                    $normalKey = preg_replace('/_+/', '_', $normalKey);
                    if (!empty($normalKey)) {
                        $normalized[$normalKey] = $value;
                    }
                }
            }
        } else {
            // Normal approach: normalize keys from row
            foreach ($row as $key => $value) {
                // Handle empty/null keys (common in CSV with empty leading columns)
                if (empty(trim($key ?? '')) || $key === null) {
                    continue;
                }
                
                $normalKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $key)));
                $normalKey = preg_replace('/_+/', '_', $normalKey);
                
                // Only add if key is not empty after normalization
                if (!empty($normalKey)) {
                    $normalized[$normalKey] = $value;
                }
            }
        }
        
        return $normalized;
    }

    /**
     * Map normalized row to database fields
     * getValue() from BaseImportTrait already handles columnIndexMapping
     */
    protected function mapToDatabaseFields(array $normalizedRow, array $originalRow = null): array
    {
        $data = [];

        foreach ($this->columnMappings as $dbField => $possibleNames) {
            if ($dbField === 'providers') {
                continue; // Handle separately
            }
            
            // getValue() from BaseImportTrait already handles columnIndexMapping
            $value = $this->getValue($normalizedRow, $possibleNames);
            
            if ($value !== null) {
                $data[$dbField] = $value;
            }
        }

        return $data;
    }

    /**
     * Get value from row with multiple possible column names
     * Also checks column index mapping for CSV with empty leading columns
     */
    protected function getValue(array $row, array $possibleKeys): ?string
    {
        // First, try to find by normalized key (normal approach)
        foreach ($possibleKeys as $key) {
            $normalKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $key)));
            $normalKey = preg_replace('/_+/', '_', $normalKey);
            
            if (isset($row[$normalKey]) && $row[$normalKey] !== null && $row[$normalKey] !== '') {
                $value = trim((string) $row[$normalKey]);
                if ($value !== '' && $value !== '-') {
                    return $value;
                }
            }
        }
        
        // If not found and row has numeric keys (from columnIndexMapping), try direct index access
        // This handles CSV with empty leading columns where WithHeadingRow creates empty keys
        if (!empty($this->columnIndexMapping)) {
            // Find which dbField this possibleKeys belongs to
            foreach ($this->columnMappings as $dbField => $possibleNames) {
                if (array_intersect($possibleKeys, $possibleNames)) {
                    // Found matching dbField, try to get value by index
                    if (isset($this->columnIndexMapping[$dbField])) {
                        $index = $this->columnIndexMapping[$dbField];
                        // Try both associative and numeric access
                        if (isset($row[$index])) {
                            $value = $row[$index];
                        } else {
                            // Convert to array and access by index
                            $rowArray = array_values($row);
                            if (isset($rowArray[$index])) {
                                $value = $rowArray[$index];
                            } else {
                                continue;
                            }
                        }
                        
                        if ($value !== null && $value !== '' && trim($value) !== '-') {
                            return trim((string) $value);
                        }
                    }
                    break;
                }
            }
        }
        
        return null;
    }

    /**
     * Handle coordinates - support both separate lat/lng and combined format
     */
    protected function handleCoordinates(array $data, array $normalizedRow): array
    {
        // If coordinates column exists, parse it
        $coordinatesStr = $this->getValue($normalizedRow, $this->columnMappings['coordinates']);
        
        if ($coordinatesStr) {
            $coords = $this->parseCoordinates($coordinatesStr);
            if ($coords['latitude'] !== null && $coords['longitude'] !== null) {
                $data['latitude'] = $coords['latitude'];
                $data['longitude'] = $coords['longitude'];
                $data['original_coordinates'] = $coordinatesStr;
            }
        }
        
        // Ensure latitude and longitude are set
        if (empty($data['latitude']) && isset($data['longitude'])) {
            // Try to parse from longitude if it contains both
            $coords = $this->parseCoordinates($data['longitude']);
            if ($coords['latitude'] !== null && $coords['longitude'] !== null) {
                $data['latitude'] = $coords['latitude'];
                $data['longitude'] = $coords['longitude'];
            }
        }

        return $data;
    }

    // parseCoordinates() moved to BaseImportTrait

    /**
     * Normalize FO Point data using generic normalizeData() from BaseImportTrait
     */
    protected function normalizeFoPointData(array $data): array
    {
        // Auto-detect type based on junction_box_image (FO Points specific)
        if (empty($data['type'])) {
            $data['type'] = !empty($data['junction_box_image']) ? 'junction' : 'pole';
        }

        // Use generic normalizeData() from BaseImportTrait
        return $this->normalizeData($data, [
            'defaults' => [
                'area' => 'ungaran',
                'status' => 'active',
                'side_of_road' => 'unknown',
            ],
            'coordinateFields' => ['latitude', 'longitude'],
            'integerFields' => ['sequence_number'],
            'imageFields' => ['isp_image', 'pole_image', 'junction_box_image'],
        ]);
    }

    /**
     * Format coordinate value
     */
    protected function formatCoordinate($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value) && strpos($value, ',') !== false) {
            $parts = explode(',', $value);
            $value = trim($parts[0]);
        }

        $floatValue = (float) $value;
        return round($floatValue, 8);
    }

    /**
     * Handle route - ensure route exists or create if autoCreateRoutes is true
     */
    protected function handleRoute(array $data): array
    {
        if (empty($data['route_name'])) {
            // Use default route if provided
            if ($this->defaultRouteId) {
                $route = FoRoute::find($this->defaultRouteId);
                if ($route) {
                    $data['route_name'] = $route->name;
                    $data['area'] = $route->area;
                } else {
                    // If defaultRouteId is invalid, set a default route name
                    $data['route_name'] = 'Default Route';
                    $data['area'] = $data['area'] ?? 'ungaran';
                }
            } else {
                // If no defaultRouteId and no route_name, set a default
                // This allows import to proceed even without route_name
                $data['route_name'] = 'Imported Route';
                $data['area'] = $data['area'] ?? 'ungaran';
            }
        } else {
            // Check if route exists
            $route = FoRoute::where('name', $data['route_name'])
                ->where('area', $data['area'] ?? 'ungaran')
                ->first();
            
            if (!$route && $this->autoCreateRoutes) {
                // Auto-create route
                $route = FoRoute::create([
                    'name' => $data['route_name'],
                    'area' => $data['area'] ?? 'ungaran',
                    'status' => 'active',
                    'description' => 'Auto-created from import',
                    'total_points' => 0,
                    'total_distance' => 0,
                    'path_coordinates' => [],
                ]);
            } elseif (!$route) {
                // If route doesn't exist and autoCreateRoutes is false, use default
                $data['route_name'] = 'Imported Route';
                $data['area'] = $data['area'] ?? 'ungaran';
            }
        }

        return $data;
    }

    /**
     * Extract providers from row
     */
    protected function extractProviders(array $normalizedRow): array
    {
        $providers = [];
        
        // Try to get providers column
        $providersStr = $this->getValue($normalizedRow, $this->columnMappings['providers']);
        
        if ($providersStr) {
            // Support comma-separated provider names
            $providerNames = array_map('trim', explode(',', $providersStr));
            
            foreach ($providerNames as $providerName) {
                if (!empty($providerName)) {
                    $provider = FoProvider::where('name', $providerName)
                        ->where('is_active', true)
                        ->first();
                    
                    if ($provider) {
                        $providers[] = $provider->id;
                    }
                }
            }
        }
        
        return array_unique($providers);
    }

    /**
     * Attach providers to point
     */
    protected function attachProviders(FoPoint $point, array $providerIds): void
    {
        if (!empty($providerIds)) {
            $syncData = FoProvider::buildSyncData($providerIds);
            $point->providers()->sync($syncData);
        }
    }

    /**
     * Handle import mode
     */
    protected function handleMode(array $data, array $originalDataForProvider = [], array $providers = [])
    {
        // Required fields validation
        if (empty($data['name']) || empty($data['latitude']) || empty($data['longitude'])) {
            return null; // Skip this row
        }

        if ($this->mode === 'upsert') {
            // Use name + coordinates as unique key (or name + route_name)
            $point = FoPoint::updateOrCreate(
                [
                    'name' => $data['name'],
                    'route_name' => $data['route_name'] ?? null,
                    'area' => $data['area'] ?? 'ungaran',
                ],
                $data
            );
            
            // Attach providers immediately for upsert (point already exists)
            if (!empty($providers)) {
                $this->attachProviders($point, $providers);
            }
            
            return $point;
        } elseif ($this->mode === 'update') {
            $point = FoPoint::where('name', $data['name'])
                ->where('route_name', $data['route_name'] ?? null)
                ->where('area', $data['area'] ?? 'ungaran')
                ->first();
            
            if ($point) {
                $point->update($data);
                
                // Attach providers immediately for update (point already exists)
                if (!empty($providers)) {
                    $this->attachProviders($point, $providers);
                }
                
                return $point;
            }
            return null; // Skip if not found
        }

        // Insert mode (default) - defer provider attachment until after batch insert
        $fillableFields = (new FoPoint())->getFillable();
        $filteredData = [];
        foreach ($fillableFields as $field) {
            $filteredData[$field] = $data[$field] ?? null;
        }
        
        $point = new FoPoint($filteredData);
        
        // Store point and provider data for later attachment
        if (!empty($providers)) {
            $this->pointsToAttachProvider[] = [
                'point' => $point,
                'data' => $originalDataForProvider,
                'providers' => $providers
            ];
        }
        
        return $point;
    }
    
    /**
     * Register events
     */
    public function registerEvents(): array
    {
        return [
            AfterImport::class => function(AfterImport $event) {
                $this->attachProvidersAfterImport();
            },
        ];
    }
    
    /**
     * Attach providers after import is complete
     */
    protected function attachProvidersAfterImport(): void
    {
        foreach ($this->pointsToAttachProvider as $item) {
            $data = $item['data'];
            $providers = $item['providers'];
            
            // Find the point that was just inserted
            $point = null;
            
            // Try to find by name + route_name + area + coordinates
            $query = FoPoint::where('name', $data['name'] ?? '');
            
            if (!empty($data['route_name'])) {
                $query->where('route_name', $data['route_name']);
            }
            
            if (!empty($data['area'])) {
                $query->where('area', $data['area']);
            }
            
            if (!empty($data['latitude']) && !empty($data['longitude'])) {
                $query->where('latitude', $data['latitude'])
                      ->where('longitude', $data['longitude']);
            }
            
            // Get the most recently created one (within last 5 minutes)
            $query->where('created_at', '>=', now()->subMinutes(5));
            $point = $query->orderBy('created_at', 'desc')->first();
            
            if ($point && !empty($providers)) {
                $this->attachProviders($point, $providers);
            }
        }
        
        $this->pointsToAttachProvider = [];
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
            'name' => 'required',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'route_name' => 'nullable', // Optional - can be set via defaultRouteId or autoCreateRoutes
            'type' => 'nullable|in:pole,junction,hub,endpoint',
            'status' => 'nullable|in:active,inactive,maintenance',
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
}

