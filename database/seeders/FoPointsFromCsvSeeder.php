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

        $imagesDirExists = File::exists($imagesRoot);
        if (!$imagesDirExists) {
            $this->command?->warn('Images directory not found (proceeding with link-only mode): ' . $imagesRoot);
        }

        $this->disableForeignKeys();
        DB::table('fo_points')->truncate();

        [$byExact, $byStem, $topFolderByRel] = $imagesDirExists
            ? $this->buildImageIndexes($imagesRoot)
            : [[], [], []];

        // Parse CSV and process each row with line-based route assignment
        $totalCreated = 0;
        $routeCounts = [];
        $currentLine = 1;

        $file = new \SplFileObject($csvPath);
        $file->setFlags(\SplFileObject::READ_CSV | \SplFileObject::SKIP_EMPTY);
        $file->setCsvControl(',');

        foreach ($file as $row) {
            if ($row === [null] || $row === false) {
                $currentLine++;
                continue;
            }

            // Normalize row values: replace "-" with empty string
            $row = array_map(function ($v) {
                if ($v === null) return '';
                $v = trim((string) $v);
                // Replace "-" with empty string
                if ($v === '-') return '';
                return $v;
            }, $row);

            // Try to extract data from this row
            $record = $this->extractDataFromRow($row);
            if ($record === null) {
                $currentLine++;
                continue;
            }

            $sequenceNumber = $this->toInt($record['nomor'] ?? null);
            $name = $this->cleanText($record['nama_lokasi'] ?? '');
            $coordsRaw = $record['koordinat'] ?? '';
            $coords = $this->parseCoordinates($coordsRaw);
            $ispRaw = $this->cleanText($record['gambar_isp'] ?? '');
            $poleRaw = $this->cleanText($record['gambar_tiang'] ?? '');
            $jbRaw = $this->cleanText($record['gambar_jb'] ?? '');

            // Prefer Google Drive links if present
            $linkIsp = $this->cleanText($record['link_isp'] ?? '');
            $linkPole = $this->cleanText($record['link_tiang'] ?? '');
            $linkJb = $this->cleanText($record['link_jb'] ?? '');

            // Skip rows with invalid core data
            if ($sequenceNumber === null || $sequenceNumber <= 0) {
                $currentLine++;
                continue;
            }
            if ($coords['latitude'] === null || $coords['longitude'] === null) {
                $this->command?->warn("Skipping row with invalid coordinates: {$coordsRaw} for point: {$name} at line {$currentLine}");
                $currentLine++;
                continue;
            }

            // Get route name based on current line number
            $routeName = $this->getRouteNameByLine($currentLine);

            $ispRel = $this->resolveImageRelativePath($ispRaw, $byExact, $byStem);
            $poleRel = $this->resolveImageRelativePath($poleRaw, $byExact, $byStem);
            $jbRel = $this->resolveImageRelativePath($jbRaw, $byExact, $byStem);

            $hasJbImage = !empty($jbRel);
            $hasJbLink = $this->isValidUrl($linkJb);
            $type = ($hasJbImage || $hasJbLink) ? 'junction' : 'pole';

            // Random side_of_road: 50% left, 50% right
            $sideOfRoad = (rand(0, 1) === 0) ? 'left' : 'right';

            // Normalize image fields: replace "-" with empty string
            $ispImageFinal = ($linkIsp !== '' ? $linkIsp : $ispRel);
            $poleImageFinal = ($linkPole !== '' ? $linkPole : $poleRel);
            $jbImageFinal = ($linkJb !== '' ? $linkJb : $jbRel);
            
            // Replace "-" with empty string
            if ($ispImageFinal === '-') $ispImageFinal = '';
            if ($poleImageFinal === '-') $poleImageFinal = '';
            if ($jbImageFinal === '-') $jbImageFinal = '';

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
                'side_of_road' => $sideOfRoad,
                'status' => 'active',
                // Store link if provided, otherwise fallback to relative path if resolved
                // "-" has been replaced with empty string
                'isp_image' => $ispImageFinal,
                'pole_image' => $poleImageFinal,
                'junction_box_image' => $jbImageFinal,
                'properties' => [
                    'source' => 'csv',
                    'csv_line' => $currentLine,
                    'link_mode' => ($linkIsp !== '' || $linkPole !== '' || $linkJb !== ''),
                ],
            ]);

            $routeCounts[$routeName] = ($routeCounts[$routeName] ?? 0) + 1;
            $totalCreated++;
            $currentLine++;
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
     * Get route name based on CSV line number according to the provided mapping.
     */
    private function getRouteNameByLine(int $lineNumber): string
    {
        $routeMapping = [
            [3, 27, 'Assalamah masuk Asmara'],
            [32, 42, 'Terminal - Assalamah'],
            [47, 51, 'Terminal - DPU'],
            [56, 69, 'Dinkes - Diskominfo'],
            [74, 93, 'Wujil - RSUD'],
            [98, 109, 'Assalamah - Taman Unyil'],
            [114, 122, 'Dishub - Bergas'],
            [127, 129, 'Pasar Karangjati - Kelurahan Karangjati'],
            [134, 151, 'Setelah Terowongan TOL - Pertigaan Kajangan'],
            [156, 171, 'Polsek Bergas - Ngempon'],
            [176, 189, 'Polsek Bergas - Wujil'],
            [194, 210, 'Terowongan - Bangjo Asmara'],
            [215, 217, 'Kelurahan Genuk'],
            [222, 224, 'SMADA'],
            [229, 244, 'Alun-Alun Lama - Ungaran Barat'],
            [249, 264, 'RSUD - Terminal'],
            [269, 271, 'Kalongan - Jembatan Longsor'],
        ];

        foreach ($routeMapping as [$startLine, $endLine, $routeName]) {
            if ($lineNumber >= $startLine && $lineNumber <= $endLine) {
                return $routeName;
            }
        }

        return 'Unknown Route';
    }

    /**
     * Extract data from a CSV row by detecting the data pattern.
     */
    private function extractDataFromRow(array $row): ?array
    {
        $len = count($row);
        
        // Look for data patterns in the row
        for ($i = 0; $i <= $len - 6; $i++) {
            $nomor = trim($row[$i] ?? '');
            $namaLokasi = trim($row[$i + 1] ?? '');
            $koordinat = trim($row[$i + 2] ?? '');
            
            // Check if this looks like a data row (has sequence number and location)
            if ($this->toInt($nomor) !== null && $namaLokasi !== '' && $koordinat !== '') {
                return [
                    'nomor' => $nomor,
                    'nama_lokasi' => $namaLokasi,
                    'koordinat' => $koordinat,
                    'gambar_isp' => $row[$i + 3] ?? '',
                    'gambar_tiang' => $row[$i + 4] ?? '',
                    'gambar_jb' => $row[$i + 5] ?? '',
                    'link_isp' => $row[$i + 6] ?? '',
                    'link_tiang' => $row[$i + 7] ?? '',
                    'link_jb' => $row[$i + 8] ?? '',
                ];
            }
        }
        
        return null;
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
        if (
            $v === '' ||
            in_array($v, ['-', 'null', 'n/a', 'na', 'none', 'kosong', 'tidak ada', '0'], true)
        ) return false;
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

    /**
     * Determine if a CSV link cell contains a valid URL.
     */
    private function isValidUrl(?string $url): bool
    {
        if ($url === null) return false;
        $u = trim($url);
        if ($u === '' || in_array(mb_strtolower($u), ['-', 'null', 'n/a', 'na', 'none', 'kosong', 'tidak ada', '0'], true)) {
            return false;
        }
        return filter_var($u, FILTER_VALIDATE_URL) !== false;
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


