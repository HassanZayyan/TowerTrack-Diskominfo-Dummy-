<?php

namespace Database\Seeders;

use App\Models\FoPoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class FoPointsFromCsvSeeder extends Seeder
{
    /**
     * Seed FO points by parsing the provided CSV and mapping images from the public folder.
     */
    public function run(): void
    {
        $csvPath = base_path('Pemetaan jalur FO ISP.csv');
        $imagesRoot = public_path('images' . DIRECTORY_SEPARATOR . 'foto jalur FO');

        if (!File::exists($csvPath)) {
            $this->command?->warn('CSV file not found: ' . $csvPath);
            return;
        }

        if (!File::exists($imagesRoot)) {
            $this->command?->warn('Images directory not found: ' . $imagesRoot);
            return;
        }

        $this->disableForeignKeys();
        DB::table('fo_points')->truncate();

        [$byExact, $byStem, $topFolderByRel] = $this->buildImageIndexes($imagesRoot);

        $segments = $this->parseCsvIntoSegments($csvPath);

        $totalCreated = 0;
        $routeCounts = [];

        foreach ($segments as $segmentIndex => $rows) {
            foreach ($rows as $row) {
                $sequenceNumber = $this->toInt($row['nomor'] ?? null);
                $name = $this->cleanText($row['nama_lokasi'] ?? '');
                $coordsRaw = $row['koordinat'] ?? '';
                $coords = $this->parseCoordinates($coordsRaw);
                $ispRaw = $this->cleanText($row['gambar_isp'] ?? '');
                $poleRaw = $this->cleanText($row['gambar_tiang'] ?? '');
                $jbRaw = $this->cleanText($row['gambar_jb'] ?? '');

                // Skip rows with invalid core data
                if ($sequenceNumber === null || $sequenceNumber <= 0) {
                    $this->command?->warn("Skipping row with invalid sequence number: {$sequenceNumber}");
                    continue;
                }
                if ($coords['latitude'] === null || $coords['longitude'] === null) {
                    $this->command?->warn("Skipping row with invalid coordinates: {$coordsRaw} for point: {$name}");
                    continue;
                }

                // Determine route folder by matching any image to indexed files
                $candidateFolders = [];
                foreach ([$ispRaw, $poleRaw, $jbRaw] as $fileRaw) {
                    if (!$this->isValidFilename($fileRaw)) {
                        continue;
                    }
                    $rel = $this->resolveImageRelativePath($fileRaw, $byExact, $byStem);
                    if ($rel) {
                        $top = $topFolderByRel[$rel] ?? null;
                        if ($top) {
                            $candidateFolders[$top] = ($candidateFolders[$top] ?? 0) + 1;
                        }
                    }
                }

                // If we cannot map to any folder, skip to keep data accurate with provided images
                if (empty($candidateFolders)) {
                    continue;
                }

                arsort($candidateFolders);
                $routeName = array_key_first($candidateFolders) ?? ('Segment ' . ($segmentIndex + 1));

                $ispRel = $this->resolveImageRelativePath($ispRaw, $byExact, $byStem);
                $poleRel = $this->resolveImageRelativePath($poleRaw, $byExact, $byStem);
                $jbRel = $this->resolveImageRelativePath($jbRaw, $byExact, $byStem);

                $type = $jbRel ? 'junction' : 'pole';

                FoPoint::create([
                    'sequence_number' => $sequenceNumber,
                    'name' => $name ?: ('Titik #' . $sequenceNumber),
                    'latitude' => $coords['latitude'],
                    'longitude' => $coords['longitude'],
                    'original_coordinates' => $coordsRaw,
                    'route_name' => $routeName,
                    'area' => 'ungaran',
                    'description' => null,
                    'type' => $type,
                    'status' => 'active',
                    'isp_image' => $ispRel,
                    'pole_image' => $poleRel,
                    'junction_box_image' => $jbRel,
                    'properties' => [
                        'source' => 'csv',
                        'segment_index' => $segmentIndex,
                    ],
                ]);

                $routeCounts[$routeName] = ($routeCounts[$routeName] ?? 0) + 1;
                $totalCreated++;
            }
        }

        $this->enableForeignKeys();

        $this->command?->info("FO Points created: {$totalCreated}");
        foreach ($routeCounts as $routeName => $count) {
            $this->command?->line(" - {$routeName}: {$count} points");
        }
    }

    /**
     * Build image indexes for quick lookup by filename and stem.
     */
    private function buildImageIndexes(string $imagesRoot): array
    {
        $byExact = [];
        $byStem = [];
        $topFolderByRel = [];

        $files = File::allFiles($imagesRoot);
        foreach ($files as $file) {
            $abs = $file->getPathname();
            $rel = ltrim(str_replace($imagesRoot . DIRECTORY_SEPARATOR, '', $abs), DIRECTORY_SEPARATOR);
            $basename = $file->getBasename();
            $basenameLower = mb_strtolower($basename);
            $stemLower = mb_strtolower(pathinfo($basenameLower, PATHINFO_FILENAME));

            $byExact[$basenameLower][] = $rel;
            $byStem[$stemLower][] = $rel;

            $parts = explode(DIRECTORY_SEPARATOR, $rel);
            $topFolderByRel[$rel] = $parts[0] ?? '';
        }

        return [$byExact, $byStem, $topFolderByRel];
    }

    /**
     * Attempt to resolve a relative image path under images/foto jalur FO given a filename from CSV.
     */
    private function resolveImageRelativePath(?string $raw, array $byExact, array $byStem): ?string
    {
        if (!$this->isValidFilename($raw)) {
            return null;
        }

        $normalized = $this->normalizeFilename($raw);

        // Try exact basename (case-insensitive)
        if (isset($byExact[$normalized])) {
            // If multiple, prefer the shortest relative path (closest match)
            $candidates = $byExact[$normalized];
            usort($candidates, fn($a, $b) => strlen($a) <=> strlen($b));
            return $candidates[0] ?? null;
        }

        // Try by stem (any extension)
        $stem = mb_strtolower(pathinfo($normalized, PATHINFO_FILENAME));
        if (isset($byStem[$stem])) {
            $candidates = $byStem[$stem];
            usort($candidates, fn($a, $b) => strlen($a) <=> strlen($b));
            return $candidates[0] ?? null;
        }

        return null;
    }

    /**
     * Parse the CSV file into logical segments, each containing rows with keys.
     * A segment is defined by encountering a header anywhere in the row.
     */
    private function parseCsvIntoSegments(string $csvPath): array
    {
        $segments = [];
        $activeOffsets = [];

        $file = new \SplFileObject($csvPath);
        $file->setFlags(\SplFileObject::READ_CSV | \SplFileObject::SKIP_EMPTY);
        $file->setCsvControl(',');

        $rowIndex = 0;
        foreach ($file as $row) {
            if ($row === [null] || $row === false) {
                $rowIndex++;
                continue;
            }

            // Normalize row values
            $row = array_map(function ($v) {
                if ($v === null) return '';
                $v = trim((string) $v);
                return $v;
            }, $row);

            // Detect new headers in this row (could be multiple offsets per row)
            $headerOffsets = $this->detectHeaderOffsets($row);
            foreach ($headerOffsets as $offset) {
                if (!array_key_exists($offset, $activeOffsets)) {
                    $activeOffsets[$offset] = count($segments);
                    $segments[] = [];
                }
            }

            // For each active segment, try to read a data record at its offset
            foreach ($activeOffsets as $offset => $segmentIndex) {
                $record = $this->extractRecordAtOffset($row, $offset);
                if ($record === null) {
                    continue;
                }
                // Skip rows that are actually headers
                if ($this->isHeaderRow($record)) {
                    continue;
                }
                $segments[$segmentIndex][] = $record;
            }

            $rowIndex++;
        }

        return $segments;
    }

    /**
     * Find offsets of headers within a row.
     */
    private function detectHeaderOffsets(array $row): array
    {
        $offsets = [];
        $len = count($row);
        for ($i = 0; $i <= $len - 6; $i++) {
            $c0 = mb_strtolower(trim($row[$i] ?? ''));
            $c1 = mb_strtolower(trim($row[$i + 1] ?? ''));
            $c2 = mb_strtolower(trim($row[$i + 2] ?? ''));
            $c3 = mb_strtolower(trim($row[$i + 3] ?? ''));
            $c4 = mb_strtolower(trim($row[$i + 4] ?? ''));
            $c5 = mb_strtolower(trim($row[$i + 5] ?? ''));

            if ($c0 === 'nomor' &&
                $c1 === 'nama lokasi' &&
                $c2 === 'koordinat' &&
                ($c3 === 'gambar isp' || $c3 === 'isp' || str_contains($c3, 'isp')) &&
                ($c4 === 'gambar tiang penuh' || $c4 === 'tiang penuh' || str_contains($c4, 'tiang')) &&
                ($c5 === 'gambar jb' || $c5 === 'joint box' || $c5 === 'jb' || str_contains($c5, 'joint'))
            ) {
                $offsets[] = $i;
            }
        }
        return $offsets;
    }

    /**
     * Extract a record at a given offset if present.
     */
    private function extractRecordAtOffset(array $row, int $offset): ?array
    {
        $slice = [];
        for ($k = 0; $k < 6; $k++) {
            $slice[$k] = $row[$offset + $k] ?? '';
        }

        // If slice is completely empty, nothing to parse
        $allEmpty = true;
        foreach ($slice as $cell) {
            if (trim((string) $cell) !== '') {
                $allEmpty = false;
                break;
            }
        }
        if ($allEmpty) {
            return null;
        }

        return [
            'nomor' => $slice[0] ?? '',
            'nama_lokasi' => $slice[1] ?? '',
            'koordinat' => $slice[2] ?? '',
            'gambar_isp' => $slice[3] ?? '',
            'gambar_tiang' => $slice[4] ?? '',
            'gambar_jb' => $slice[5] ?? '',
        ];
    }

    /**
     * Check if a record is a header row.
     */
    private function isHeaderRow(array $record): bool
    {
        $c0 = mb_strtolower(trim((string) ($record['nomor'] ?? '')));
        $c1 = mb_strtolower(trim((string) ($record['nama_lokasi'] ?? '')));
        $c2 = mb_strtolower(trim((string) ($record['koordinat'] ?? '')));
        $c3 = mb_strtolower(trim((string) ($record['gambar_isp'] ?? '')));
        $c4 = mb_strtolower(trim((string) ($record['gambar_tiang'] ?? '')));
        $c5 = mb_strtolower(trim((string) ($record['gambar_jb'] ?? '')));

        return $c0 === 'nomor' && $c1 === 'nama lokasi' && $c2 === 'koordinat';
    }

    /**
     * Parse coordinates from CSV. Returns ['latitude' => ?float, 'longitude' => ?float].
     */
    private function parseCoordinates(?string $raw): array
    {
        if ($raw === null) {
            return ['latitude' => null, 'longitude' => null];
        }
        $raw = trim($raw, " \t\n\r\0\x0B\"");
        
        // Handle malformed coordinates like "-71858219,110.4368589" (missing decimal point)
        if (preg_match('/^(-?\d{8,})(\d{2,})[\s]*,[\s]*(-?\d+(?:\.\d+)?)$/', $raw, $m)) {
            // Fix malformed latitude by adding decimal point
            $lat = (float) ($m[1] . '.' . $m[2]);
            $lng = (float) $m[3];
            
            // Validate ranges
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['latitude' => $lat, 'longitude' => $lng];
            }
        }
        
        // Accept forms like "-7.121637,110.408685" or with spaces
        if (preg_match('/^(-?\d+(?:\.\d+)?)[\s]*,[\s]*(-?\d+(?:\.\d+)?)$/', $raw, $m)) {
            $lat = (float) $m[1];
            $lng = (float) $m[2];
            
            // Validate ranges
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['latitude' => $lat, 'longitude' => $lng];
            }
        }
        
        return ['latitude' => null, 'longitude' => null];
    }

    /**
     * Determine if a CSV filename cell is a real filename.
     */
    private function isValidFilename(?string $name): bool
    {
        if ($name === null) return false;
        $v = trim(mb_strtolower($name));
        if ($v === '' || $v === '-' || $v === 'null') return false;
        if ($v === '[url]' || str_contains($v, 'http://') || str_contains($v, 'https://')) return false;
        return true;
    }

    /**
     * Normalize filename for case-insensitive matching.
     */
    private function normalizeFilename(string $name): string
    {
        $v = trim($name);
        // Collapse multiple spaces and normalize case
        $v = preg_replace('/\s+/', ' ', $v);
        return mb_strtolower($v);
    }

    /**
     * Convert to integer if possible.
     */
    private function toInt($value): ?int
    {
        if ($value === null) return null;
        $v = trim((string) $value);
        if ($v === '') return null;
        if (!preg_match('/^-?\d+$/', $v)) return null;
        return (int) $v;
    }

    /**
     * Clean generic text cell.
     */
    private function cleanText(?string $value): string
    {
        if ($value === null) return '';
        $v = trim($value);
        return $v;
    }

    private function disableForeignKeys(): void
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } catch (\Throwable $e) {
            // Ignore for non-MySQL drivers
        }
    }

    private function enableForeignKeys(): void
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (\Throwable $e) {
            // Ignore for non-MySQL drivers
        }
    }
}


