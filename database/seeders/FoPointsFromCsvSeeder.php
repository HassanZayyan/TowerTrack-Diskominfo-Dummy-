<?php

namespace Database\Seeders;

use App\Models\FoPoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class FoPointsFromCsvSeeder extends Seeder
{
    /**
     * Mapping dari nama route real ke nama route dummy untuk keamanan data.
     * Route names diubah menjadi generic untuk menghindari eksposisi informasi sensitif.
     */
    private function getRouteNameMapping(): array
    {
        return [
            'Assalamah masuk Asmara' => 'Jalur FO Utama 1',
            'Terminal - Assalamah' => 'Jalur FO Utama 2',
            'Terminal - DPU' => 'Jalur FO Sekunder 1',
            'Dinkes - Diskominfo' => 'Jalur FO Sekunder 2',
            'Wujil - RSUD' => 'Jalur FO Utama 3',
            'Assalamah - Taman Unyil' => 'Jalur FO Sekunder 3',
            'Dishub - Bergas' => 'Jalur FO Sekunder 4',
            'Pasar Karangjati - Kelurahan Karangjati' => 'Jalur FO Lokal 1',
            'Setelah Terowongan TOL - Pertigaan Kajangan' => 'Jalur FO Utama 4',
            'Polsek Bergas - Ngempon' => 'Jalur FO Sekunder 5',
            'Polsek Bergas - Wujil' => 'Jalur FO Sekunder 6',
            'Terowongan - Bangjo Asmara' => 'Jalur FO Utama 5',
            'Kelurahan Genuk' => 'Jalur FO Lokal 2',
            'SMADA' => 'Jalur FO Lokal 3',
            'Alun-Alun Lama - Ungaran Barat' => 'Jalur FO Utama 6',
            'RSUD - Terminal' => 'Jalur FO Utama 7',
            'Kalongan - Jembatan Longsor' => 'Jalur FO Lokal 4',
        ];
    }

    /**
     * Get route name based on CSV line number (from original implementation).
     * Returns REAL route name, which will be mapped to dummy name later.
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
     * Seed FO points with REAL coordinates from CSV but DUMMY route names and point names.
     * Images are kept from original route (safe because route names are already dummy).
     */
    public function run(): void
    {
        $csvPath = base_path('Pemetaan jalur FO ISP.csv');
        $imagesRoot = public_path('images' . DIRECTORY_SEPARATOR . 'foto jalur FO');

        if (!File::exists($csvPath)) {
            $this->command?->warn('CSV file not found: ' . $csvPath);
            $this->command?->warn('Falling back to dummy data generation...');
            $this->generateDummyFoPoints();
            return;
        }

        $imagesDirExists = File::exists($imagesRoot);
        if (!$imagesDirExists) {
            $this->command?->warn('Images directory not found (proceeding with link-only mode): ' . $imagesRoot);
        }

        $this->disableForeignKeys();
        DB::table('fo_points')->truncate();

        // Build image indexes if directory exists
        [$byExact, $byStem, $topFolderByRel] = $imagesDirExists
            ? $this->buildImageIndexes($imagesRoot)
            : [[], [], []];

        // Get route name mapping
        $routeNameMapping = $this->getRouteNameMapping();

        // Parse CSV and process each row
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

            // Normalize row values
            $row = array_map(function ($v) {
                if ($v === null) return '';
                $v = trim((string) $v);
                if ($v === '-') return '';
                return $v;
            }, $row);

            // Extract data from row
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

            // Get REAL route name from line number, then map to DUMMY route name
            $realRouteName = $this->getRouteNameByLine($currentLine);
            $dummyRouteName = $routeNameMapping[$realRouteName] ?? 'Jalur FO ' . $sequenceNumber;

            // Resolve images (keep original images - safe because route name is already dummy)
            $ispRel = $this->resolveImageRelativePath($ispRaw, $byExact, $byStem);
            $poleRel = $this->resolveImageRelativePath($poleRaw, $byExact, $byStem);
            $jbRel = $this->resolveImageRelativePath($jbRaw, $byExact, $byStem);

            $hasJbImage = !empty($jbRel);
            $hasJbLink = $this->isValidUrl($linkJb);
            $type = ($hasJbImage || $hasJbLink) ? 'junction' : 'pole';

            // Random side_of_road
            $sideOfRoad = (rand(0, 1) === 0) ? 'left' : 'right';

            // Normalize image fields
            $ispImageFinal = ($linkIsp !== '' ? $linkIsp : $ispRel);
            $poleImageFinal = ($linkPole !== '' ? $linkPole : $poleRel);
            $jbImageFinal = ($linkJb !== '' ? $linkJb : $jbRel);
            
            if ($ispImageFinal === '-') $ispImageFinal = '';
            if ($poleImageFinal === '-') $poleImageFinal = '';
            if ($jbImageFinal === '-') $jbImageFinal = '';

            // Create FO point with REAL coordinates, DUMMY name and route name
            FoPoint::create([
                'sequence_number' => $sequenceNumber,
                'name' => 'Titik FO ' . $sequenceNumber, // DUMMY name
                'latitude' => $coords['latitude'], // REAL from CSV
                'longitude' => $coords['longitude'], // REAL from CSV
                'original_coordinates' => $coordsRaw,
                'route_name' => $dummyRouteName, // DUMMY route name
                'area' => 'ungaran',
                'description' => 'Titik fiber optik untuk keperluan presentasi', // DUMMY description
                'type' => $type,
                'side_of_road' => $sideOfRoad,
                'status' => 'active',
                // Images are kept from original (safe because route name is dummy)
                'isp_image' => $ispImageFinal,
                'pole_image' => $poleImageFinal,
                'junction_box_image' => $jbImageFinal,
                'properties' => [
                    'source' => 'csv_with_dummy_names',
                    'csv_line' => $currentLine,
                    'original_route_name' => $realRouteName, // Store original for reference (not displayed)
                    'link_mode' => ($linkIsp !== '' || $linkPole !== '' || $linkJb !== ''),
                ],
            ]);

            $routeCounts[$dummyRouteName] = ($routeCounts[$dummyRouteName] ?? 0) + 1;
            $totalCreated++;
            $currentLine++;
        }

        $this->enableForeignKeys();

        $this->command?->info("FO Points created: {$totalCreated} with real coordinates and dummy route names");
        foreach ($routeCounts as $routeName => $count) {
            $this->command?->line(" - {$routeName}: {$count} points");
        }
    }

    /**
     * Fallback: Generate dummy FO points if CSV is not available
     */
    private function generateDummyFoPoints(): void
    {
        $this->disableForeignKeys();
        DB::table('fo_points')->truncate();

        $routes = [
            ['name' => 'Jalur FO Utama 1', 'points' => 25],
            ['name' => 'Jalur FO Utama 2', 'points' => 11],
            ['name' => 'Jalur FO Sekunder 1', 'points' => 5],
            ['name' => 'Jalur FO Sekunder 2', 'points' => 14],
            ['name' => 'Jalur FO Utama 3', 'points' => 20],
            ['name' => 'Jalur FO Sekunder 3', 'points' => 12],
            ['name' => 'Jalur FO Sekunder 4', 'points' => 9],
            ['name' => 'Jalur FO Lokal 1', 'points' => 3],
            ['name' => 'Jalur FO Utama 4', 'points' => 18],
            ['name' => 'Jalur FO Sekunder 5', 'points' => 16],
            ['name' => 'Jalur FO Sekunder 6', 'points' => 14],
            ['name' => 'Jalur FO Utama 5', 'points' => 17],
            ['name' => 'Jalur FO Lokal 2', 'points' => 3],
            ['name' => 'Jalur FO Lokal 3', 'points' => 3],
            ['name' => 'Jalur FO Utama 6', 'points' => 16],
            ['name' => 'Jalur FO Utama 7', 'points' => 16],
            ['name' => 'Jalur FO Lokal 4', 'points' => 3],
        ];

        $baseLat = -7.1390;
        $baseLon = 110.4050;
        $totalCreated = 0;
        $routeCounts = [];
        $sequenceNumber = 1;

        foreach ($routes as $route) {
            $routeName = $route['name'];
            $numPoints = $route['points'];
            $routeCounts[$routeName] = 0;

            for ($i = 0; $i < $numPoints; $i++) {
                $latOffset = ($i * 0.001) + (rand(-50, 50) / 10000);
                $lonOffset = ($i * 0.001) + (rand(-50, 50) / 10000);
                
                $latitude = $baseLat + $latOffset;
                $longitude = $baseLon + $lonOffset;

                $hasJb = rand(0, 1) === 1;
                $type = $hasJb ? 'junction' : 'pole';
                $sideOfRoad = (rand(0, 1) === 0) ? 'left' : 'right';

                FoPoint::create([
                    'sequence_number' => $sequenceNumber,
                    'name' => 'Titik FO ' . $sequenceNumber,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'original_coordinates' => number_format($latitude, 6) . ',' . number_format($longitude, 6),
                    'route_name' => $routeName,
                    'area' => 'ungaran',
                    'description' => 'Dummy FO point untuk keperluan presentasi',
                    'type' => $type,
                    'side_of_road' => $sideOfRoad,
                    'status' => 'active',
                    'isp_image' => '',
                    'pole_image' => '',
                    'junction_box_image' => '',
                    'properties' => [
                        'source' => 'dummy_seeder',
                        'generated_at' => now()->toISOString(),
                        'is_dummy_data' => true,
                    ],
                ]);

                $sequenceNumber++;
                $routeCounts[$routeName]++;
                $totalCreated++;
            }
        }

        $this->enableForeignKeys();

        $this->command?->info("FO Points created: {$totalCreated} (fallback mode)");
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
     * Extract data from a CSV row by detecting the data pattern.
     */
    private function extractDataFromRow(array $row): ?array
    {
        $len = count($row);
        
        for ($i = 0; $i <= $len - 6; $i++) {
            $nomor = trim($row[$i] ?? '');
            $namaLokasi = trim($row[$i + 1] ?? '');
            $koordinat = trim($row[$i + 2] ?? '');
            
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
        
        // Handle malformed coordinates
        if (preg_match('/^(-?\d{8,})(\d{2,})[\s]*,[\s]*(-?\d+(?:\.\d+)?)$/', $raw, $m)) {
            $lat = (float) ($m[1] . '.' . $m[2]);
            $lng = (float) $m[3];
            
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['latitude' => $lat, 'longitude' => $lng];
            }
        }
        
        // Accept forms like "-7.121637,110.408685"
        if (preg_match('/^(-?\d+(?:\.\d+)?)[\s]*,[\s]*(-?\d+(?:\.\d+)?)$/', $raw, $m)) {
            $lat = (float) $m[1];
            $lng = (float) $m[2];
            
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
