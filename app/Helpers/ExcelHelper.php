<?php

namespace App\Helpers;

use Maatwebsite\Excel\Facades\Excel;

/**
 * Excel Helper Class
 * DRY: Shared Excel file operations
 * 
 * Provides common functionality:
 * - Header row detection
 * - Header row cleaning
 * - File validation
 */
class ExcelHelper
{
    /**
     * Find header row in Excel file
     * 
     * @param mixed $file
     * @param array $headerKeywords Keywords to identify header row
     * @return array ['headerRow' => array, 'headerRowIndex' => int|null, 'startIndex' => int]
     */
    public static function findHeaderRow($file, array $headerKeywords = ['nama', 'lokasi', 'koordinat', 'nomor']): array
    {
        $allRows = Excel::toArray(new \stdClass(), $file);
        $headerRow = [];
        $headerRowIndex = null;
        
        // Find first non-empty row that looks like a header
        foreach ($allRows[0] ?? [] as $rowIndex => $row) {
            // Skip completely empty rows
            $nonEmptyValues = array_filter($row, function($v) { 
                return !empty(trim($v ?? '')); 
            });
            if (empty($nonEmptyValues)) {
                continue;
            }
            
            // Check if this row looks like a header (has column names)
            $rowString = implode(' ', array_map('trim', $nonEmptyValues));
            $hasHeaderKeywords = false;
            foreach ($headerKeywords as $keyword) {
                if (stripos($rowString, $keyword) !== false) {
                    $hasHeaderKeywords = true;
                    break;
                }
            }
            
            if ($hasHeaderKeywords) {
                $headerRow = $row;
                $headerRowIndex = $rowIndex;
                break;
            }
        }
        
        // If no header found, use first row
        if (empty($headerRow) && !empty($allRows[0])) {
            $headerRow = $allRows[0][0] ?? [];
            $headerRowIndex = 0;
        }
        
        // Clean header row: remove empty columns at the start
        $cleanedHeaderRow = [];
        $startIndex = 0;
        
        // Find first non-empty column
        foreach ($headerRow as $index => $value) {
            if (!empty(trim($value ?? ''))) {
                $startIndex = $index;
                break;
            }
        }
        
        // Extract only non-empty columns from header
        $cleanedHeaderRow = array_slice($headerRow, $startIndex);
        
        return [
            'headerRow' => $headerRow,
            'cleanedHeaderRow' => $cleanedHeaderRow,
            'headerRowIndex' => $headerRowIndex,
            'startIndex' => $startIndex,
        ];
    }

    /**
     * Build column index mapping for CSV with empty leading columns
     * 
     * @param array $detectedMapping
     * @param array $cleanedHeaderRow
     * @param int $startIndex
     * @return array
     */
    public static function buildColumnIndexMapping(array $detectedMapping, array $cleanedHeaderRow, int $startIndex): array
    {
        $columnIndexMapping = [];
        
        foreach ($detectedMapping as $dbField => $headerName) {
            // Find the index of this header in the cleaned header row
            $cleanedIndex = array_search($headerName, $cleanedHeaderRow);
            if ($cleanedIndex !== false) {
                // Add startIndex offset to get actual column index in CSV
                $columnIndexMapping[$dbField] = $startIndex + $cleanedIndex;
            }
        }
        
        return $columnIndexMapping;
    }

    /**
     * Get validation rules for Excel file upload
     * 
     * @return array
     */
    public static function getFileValidationRules(): array
    {
        return [
            'file' => 'required|mimes:xlsx,xls|max:10240', // Excel only (template required)
        ];
    }

    /**
     * Get validation messages for Excel file upload
     * 
     * @return array
     */
    public static function getFileValidationMessages(): array
    {
        return [
            'file.mimes' => 'File harus berupa template Excel (.xlsx atau .xls). CSV tidak didukung.',
        ];
    }

    /**
     * Parse coordinates from string format "lat,lng" for validation
     * DRY: Shared coordinate parsing logic
     * 
     * @param string|null $coordinateString
     * @return array ['latitude' => float|null, 'longitude' => float|null]
     */
    public static function parseCoordinates(?string $coordinateString): array
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
}

