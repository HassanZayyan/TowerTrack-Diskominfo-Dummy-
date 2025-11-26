<?php

namespace App\Traits;

/**
 * Base Import Trait
 * DRY: Shared methods untuk semua import classes
 * 
 * Provides common functionality:
 * - Row normalization
 * - Value extraction
 * - Column mapping detection
 * - Coordinate formatting
 * - Date parsing
 */
trait BaseImportTrait
{
    /**
     * Normalize row keys: lowercase, remove spaces, handle special chars
     * Handles columnIndexMapping for CSV with empty leading columns
     * 
     * @param array $row
     * @return array
     */
    protected function normalizeRow(array $row): array
    {
        $normalized = [];
        $columnIndexMapping = $this->columnIndexMapping ?? [];
        
        // Handle column index mapping for CSV with empty leading columns
        if (!empty($columnIndexMapping)) {
            // Reconstruct row using column index mapping
            foreach ($columnIndexMapping as $dbField => $index) {
                if (isset($row[$index])) {
                    $normalized[$index] = $row[$index];
                }
            }
            
            // Also normalize by key (for cases where key is not empty)
            foreach ($row as $key => $value) {
                if (!empty(trim($key ?? '')) && $key !== null) {
                    $normalKey = $this->normalizeKey($key);
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
                
                $normalKey = $this->normalizeKey($key);
                
                // Only add if key is not empty after normalization
                if (!empty($normalKey)) {
                    $normalized[$normalKey] = $value;
                }
            }
        }
        
        return $normalized;
    }

    /**
     * Normalize a single key
     * 
     * @param string $key
     * @return string
     */
    protected function normalizeKey(string $key): string
    {
        $normalKey = strtolower(trim(str_replace([' ', '-', '.', '/'], '_', $key)));
        return preg_replace('/_+/', '_', $normalKey);
    }

    /**
     * Get value from row with multiple possible column names
     * Handles columnIndexMapping for CSV with empty leading columns
     * 
     * @param array $row
     * @param array $possibleKeys
     * @return string|null
     */
    protected function getValue(array $row, array $possibleKeys): ?string
    {
        // First, try to find by normalized key (normal approach)
        foreach ($possibleKeys as $key) {
            $normalKey = $this->normalizeKey($key);
            
            if (isset($row[$normalKey]) && $row[$normalKey] !== null && $row[$normalKey] !== '') {
                $value = trim((string) $row[$normalKey]);
                if ($value !== '' && $value !== '-') {
                    return $value;
                }
            }
        }
        
        // If not found and row has numeric keys (from columnIndexMapping), try direct index access
        $columnIndexMapping = $this->columnIndexMapping ?? [];
        $columnMappings = $this->columnMappings ?? [];
        
        if (!empty($columnIndexMapping)) {
            // Find which dbField this possibleKeys belongs to
            foreach ($columnMappings as $dbField => $possibleNames) {
                if (array_intersect($possibleKeys, $possibleNames)) {
                    // Found matching dbField, try to get value by index
                    if (isset($columnIndexMapping[$dbField])) {
                        $index = $columnIndexMapping[$dbField];
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
     * Format coordinate value to ensure proper decimal precision
     * 
     * @param mixed $value
     * @return float|null
     */
    protected function formatCoordinate($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Handle format: "-7.121637,110.408685" (from CSV)
        if (is_string($value) && strpos($value, ',') !== false) {
            $parts = explode(',', $value);
            $value = trim($parts[0]); // Take first part as coordinate
        }

        $floatValue = (float) $value;
        
        // Check if the value is within valid ranges
        return round($floatValue, 8);
    }

    /**
     * Detect column mapping from headers
     * 
     * @param array $headers
     * @return array
     */
    public function detectColumnMapping(array $headers): array
    {
        $mapping = [];
        $normalizedHeaders = [];
        
        // Normalize headers
        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeKey($header);
            $normalizedHeaders[$index] = $normalized;
        }
        
        // Find matches
        foreach ($this->columnMappings ?? [] as $dbField => $possibleNames) {
            foreach ($possibleNames as $possibleName) {
                $normalized = $this->normalizeKey($possibleName);
                
                foreach ($normalizedHeaders as $index => $normalizedHeader) {
                    // Exact match or contains
                    if ($normalized === $normalizedHeader || 
                        str_contains($normalizedHeader, $normalized) ||
                        str_contains($normalized, $normalizedHeader)) {
                        $mapping[$dbField] = $headers[$index]; // Store original header name
                        break 2; // Found, move to next field
                    }
                }
            }
        }
        
        return $mapping;
    }

    /**
     * Parse date from various formats
     * 
     * @param mixed $value
     * @return string|null
     */
    protected function parseDate($value): ?string
    {
        if (empty($value) || $value === '-') {
            return null;
        }

        // Try Carbon to parse various date formats
        try {
            // Try common formats
            $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d', 'd M Y', 'd F Y'];
            
            foreach ($formats as $format) {
                try {
                    $date = \Carbon\Carbon::createFromFormat($format, trim($value));
                    return $date->format('Y-m-d');
                } catch (\Exception $e) {
                    continue;
                }
            }
            
            // Try Carbon's flexible parser
            $date = \Carbon\Carbon::parse($value);
            return $date->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Parse coordinates from string format "lat,lng" or "-7.123,110.456"
     * Optional method - only used by imports that need coordinate parsing
     * 
     * @param string|null $coordinateString
     * @return array ['latitude' => float|null, 'longitude' => float|null]
     */
    protected function parseCoordinates(?string $coordinateString): array
    {
        if (empty($coordinateString)) {
            return ['latitude' => null, 'longitude' => null];
        }

        $coordinateString = trim($coordinateString, " \t\n\r\0\x0B\"");
        
        // Handle malformed coordinates like "-71858219,110.4368589" (missing decimal point)
        if (preg_match('/^(-?\d{8,})(\d{2,})[\s]*,[\s]*(-?\d+(?:\.\d+)?)$/', $coordinateString, $m)) {
            $lat = (float) ($m[1] . '.' . $m[2]);
            $lng = (float) $m[3];
            
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['latitude' => $lat, 'longitude' => $lng];
            }
        }
        
        // Accept forms like "-7.121637,110.408685" or with spaces
        if (preg_match('/^(-?\d+(?:\.\d+)?)[\s]*,[\s]*(-?\d+(?:\.\d+)?)$/', $coordinateString, $m)) {
            $lat = (float) $m[1];
            $lng = (float) $m[2];
            
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['latitude' => $lat, 'longitude' => $lng];
            }
        }

        return ['latitude' => null, 'longitude' => null];
    }

    /**
     * Generic data normalization method
     * DRY: Shared normalization logic for all import classes
     * 
     * @param array $data
     * @param array $config Configuration array:
     *   - 'defaults' => ['field' => 'value'] - Set default values
     *   - 'coordinateFields' => ['latitude', 'longitude'] - Format as coordinates
     *   - 'numericFields' => ['field1', 'field2'] - Cast to float
     *   - 'integerFields' => ['field1', 'field2'] - Cast to int
     *   - 'dateFields' => ['field1', 'field2'] - Parse as dates
     *   - 'imageFields' => ['field1', 'field2'] - Normalize image URLs (empty/dash to null)
     *   - 'stringFields' => ['field1', 'field2'] - Normalize strings (empty/dash to null)
     * @return array
     */
    protected function normalizeData(array $data, array $config = []): array
    {
        // Set defaults
        if (isset($config['defaults'])) {
            foreach ($config['defaults'] as $field => $defaultValue) {
                if (empty($data[$field])) {
                    $data[$field] = $defaultValue;
                }
            }
        }

        // Normalize coordinate fields
        if (isset($config['coordinateFields'])) {
            foreach ($config['coordinateFields'] as $field) {
                if (isset($data[$field])) {
                    $data[$field] = $this->formatCoordinate($data[$field]);
                }
            }
        }

        // Normalize numeric fields
        if (isset($config['numericFields'])) {
            foreach ($config['numericFields'] as $field) {
                if (isset($data[$field])) {
                    if ($data[$field] === '' || $data[$field] === null) {
                        $data[$field] = null;
                    } else {
                        $data[$field] = is_numeric($data[$field]) ? (float) $data[$field] : null;
                    }
                }
            }
        }

        // Normalize integer fields
        if (isset($config['integerFields'])) {
            foreach ($config['integerFields'] as $field) {
                if (isset($data[$field]) && $data[$field] !== null) {
                    $data[$field] = (int) $data[$field];
                }
            }
        }

        // Normalize date fields
        if (isset($config['dateFields'])) {
            foreach ($config['dateFields'] as $field) {
                if (isset($data[$field])) {
                    if ($data[$field] === '' || $data[$field] === null) {
                        $data[$field] = null;
                    } else {
                        $data[$field] = $this->parseDate($data[$field]);
                    }
                }
            }
        }

        // Normalize image/string fields (empty/dash to null)
        $normalizeFields = array_merge(
            $config['imageFields'] ?? [],
            $config['stringFields'] ?? []
        );
        
        foreach ($normalizeFields as $field) {
            if (isset($data[$field])) {
                $value = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
                if ($value === '' || $value === '-' || $value === null) {
                    $data[$field] = null;
                } else {
                    $data[$field] = $value;
                }
            }
        }

        return $data;
    }
}

