<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Support\KecamatanSemarang;

class TowerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates towers with REAL coordinates from CSV but DUMMY information.
     * This approach maintains realistic map visualization while protecting sensitive data.
     */
    public function run(): void
    {
        $csvFile = database_path('../Data_menara_rev.csv');
        
        if (!file_exists($csvFile)) {
            $this->command->error('CSV file not found: ' . $csvFile);
            $this->command->warn('Falling back to dummy coordinates...');
            $this->generateDummyTowers();
            return;
        }

        $towers = [];
        $handle = fopen($csvFile, 'r');
        
        // Skip header row
        fgetcsv($handle);
        
        $towerCounter = 1;
        $towerTypes = ['Monopole', 'Guyed', 'Self-Supporting', 'Lattice'];
        $siteTypes = ['Macro', 'Micro', 'Small Cell'];
        $jenisIjin = ['Izin Prinsip', 'Izin Operasional', 'Izin Permanen'];
        $statusIjin = ['Aktif', 'Non-Aktif', 'Dalam Proses'];
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 13) {
                continue;
            }
            
            // Parse REAL coordinates from CSV
            $longitude = !empty(trim($row[6])) ? (float) trim($row[6]) : null;
            $latitude = !empty(trim($row[7])) ? (float) trim($row[7]) : null;
            
            // Skip if coordinates are invalid
            if ($latitude === null || $longitude === null || 
                abs($latitude) > 90 || abs($longitude) > 180 ||
                ($latitude == 0 && $longitude == 0)) {
                continue;
            }
            
            // Parse dates (use real dates if available, otherwise generate dummy)
            $tanggalIjin = null;
            $berlakuHingga = null;
            
            if (!empty(trim($row[16]))) {
                try {
                    $tanggalIjin = Carbon::createFromFormat('d/m/Y', trim($row[16]));
                } catch (\Exception $e) {
                    // If parsing fails, generate dummy date
                    $tanggalIjin = Carbon::now()->subYears(rand(1, 5))->subDays(rand(0, 365));
                }
            } else {
                $tanggalIjin = Carbon::now()->subYears(rand(1, 5))->subDays(rand(0, 365));
            }
            
            if (!empty(trim($row[17]))) {
                try {
                    $berlakuHingga = Carbon::createFromFormat('d/m/Y', trim($row[17]));
                } catch (\Exception $e) {
                    // If parsing fails, generate dummy date
                    $berlakuHingga = $tanggalIjin->copy()->addYears(rand(1, 3));
                }
            } else {
                $berlakuHingga = $tanggalIjin->copy()->addYears(rand(1, 3));
            }
            
            // The district is DERIVED, not invented: nearest centre to the
            // real coordinates. See App\Support\KecamatanSemarang for why
            // nearest-centre and not a polygon test.
            $kecamatan = KecamatanSemarang::nearest($latitude, $longitude);

            // Generate DUMMY information
            $towers[] = [
                'site_id' => 'SITE' . str_pad($towerCounter, 4, '0', STR_PAD_LEFT),
                'site_sap' => 'SAP' . str_pad($towerCounter, 5, '0', STR_PAD_LEFT),
                'site_name' => 'Tower Site ' . $towerCounter,
                'longitude' => $longitude, // REAL from CSV
                'latitude' => $latitude, // REAL from CSV
                'tinggi_menara' => !empty(trim($row[8])) ? (float) trim($row[8]) : (rand(30, 120) + (rand(0, 99) / 100)),
                'tinggi_bangunan' => !empty(trim($row[9])) ? (float) trim($row[9]) : (rand(0, 50) + (rand(0, 99) / 100)),
                'jumlah_pengguna' => !empty(trim($row[10])) ? (int) trim($row[10]) : rand(100, 5000),
                'jumlah_kaki' => !empty(trim($row[11])) ? (int) trim($row[11]) : rand(3, 4),
                'alamat_menara' => 'Jl. Dummy No. ' . $towerCounter . ', Kec. ' . $kecamatan . ', Kabupaten Semarang', // DUMMY street, REAL district
                'kecamatan' => $kecamatan,
                'tower_type' => !empty(trim($row[13])) ? trim($row[13]) : $towerTypes[array_rand($towerTypes)],
                'site_type' => !empty(trim($row[14])) ? trim($row[14]) : $siteTypes[array_rand($siteTypes)],
                'no_ijin' => 'IJIN/' . date('Y') . '/' . str_pad($towerCounter, 4, '0', STR_PAD_LEFT), // DUMMY
                'tanggal_ijin' => $tanggalIjin->format('Y-m-d'),
                'berlaku_hingga' => $berlakuHingga->format('Y-m-d'),
                'jenis_ijin' => !empty(trim($row[18])) ? trim($row[18]) : $jenisIjin[array_rand($jenisIjin)],
                'status_ijin' => !empty(trim($row[19])) ? trim($row[19]) : $statusIjin[array_rand($statusIjin)],
                'prs' => 'PRS-' . str_pad($towerCounter, 3, '0', STR_PAD_LEFT), // DUMMY
                'prs_id' => 'PRSID' . str_pad($towerCounter, 4, '0', STR_PAD_LEFT), // DUMMY
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            $towerCounter++;
        }
        
        fclose($handle);
        
        // Insert towers in chunks to avoid memory issues
        if (!empty($towers)) {
            $chunks = array_chunk($towers, 100);
            foreach ($chunks as $chunk) {
                DB::table('towers')->insert($chunk);
            }
            
            $this->command->info('Inserted ' . count($towers) . ' towers with real coordinates and dummy information');
        } else {
            $this->command->warn('No towers were inserted. Check CSV file format.');
        }
        
        // Generate towers without coordinates
        $this->generateTowersWithoutCoordinates($towerCounter);
    }
    
    /**
     * Fallback: Generate dummy towers if CSV is not available
     */
    private function generateDummyTowers(): void
    {
        $towers = [];
        $baseLat = -7.1390;
        $baseLon = 110.4050;
        
        $towerTypes = ['Monopole', 'Guyed', 'Self-Supporting', 'Lattice'];
        $siteTypes = ['Macro', 'Micro', 'Small Cell'];
        $jenisIjin = ['Izin Prinsip', 'Izin Operasional', 'Izin Permanen'];
        $statusIjin = ['Aktif', 'Non-Aktif', 'Dalam Proses'];
        
        for ($i = 1; $i <= 50; $i++) {
            $latitude = $baseLat + (rand(-500, 500) / 10000);
            $longitude = $baseLon + (rand(-500, 500) / 10000);
            $tanggalIjin = Carbon::now()->subYears(rand(1, 5))->subDays(rand(0, 365));
            $berlakuHingga = $tanggalIjin->copy()->addYears(rand(1, 3));
            $kecamatan = KecamatanSemarang::nearest($latitude, $longitude);
            
            $towers[] = [
                'site_id' => 'SITE' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'site_sap' => 'SAP' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'site_name' => 'Tower Site ' . $i,
                'longitude' => $longitude,
                'latitude' => $latitude,
                'tinggi_menara' => rand(30, 120) + (rand(0, 99) / 100),
                'tinggi_bangunan' => rand(0, 50) + (rand(0, 99) / 100),
                'jumlah_pengguna' => rand(100, 5000),
                'jumlah_kaki' => rand(3, 4),
                'alamat_menara' => 'Jl. Dummy No. ' . $i . ', Kec. ' . $kecamatan . ', Kabupaten Semarang',
                'kecamatan' => $kecamatan,
                'tower_type' => $towerTypes[array_rand($towerTypes)],
                'site_type' => $siteTypes[array_rand($siteTypes)],
                'no_ijin' => 'IJIN/' . date('Y') . '/' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'tanggal_ijin' => $tanggalIjin->format('Y-m-d'),
                'berlaku_hingga' => $berlakuHingga->format('Y-m-d'),
                'jenis_ijin' => $jenisIjin[array_rand($jenisIjin)],
                'status_ijin' => $statusIjin[array_rand($statusIjin)],
                'prs' => 'PRS-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'prs_id' => 'PRSID' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        $chunks = array_chunk($towers, 100);
        foreach ($chunks as $chunk) {
            DB::table('towers')->insert($chunk);
        }
        
        $this->command->info('Inserted ' . count($towers) . ' dummy towers (fallback mode)');
        
        // Generate towers without coordinates
        $this->generateTowersWithoutCoordinates(51);
    }
    
    /**
     * Generate towers without coordinates (longitude and latitude are null)
     * 
     * @param int $startCounter Starting counter for tower numbering
     */
    private function generateTowersWithoutCoordinates(int $startCounter = 1): void
    {
        $towers = [];
        
        $towerTypes = ['Monopole', 'Guyed', 'Self-Supporting', 'Lattice'];
        $siteTypes = ['Macro', 'Micro', 'Small Cell'];
        $jenisIjin = ['Izin Prinsip', 'Izin Operasional', 'Izin Permanen'];
        $statusIjin = ['Aktif', 'Non-Aktif', 'Dalam Proses'];
        
        for ($i = 0; $i < 50; $i++) {
            $counter = $startCounter + $i;
            $tanggalIjin = Carbon::now()->subYears(rand(1, 5))->subDays(rand(0, 365));
            $berlakuHingga = $tanggalIjin->copy()->addYears(rand(1, 3));
            // These rows exist to exercise the "Belum Terdata" paths, so there
            // is no coordinate to derive a district from. The district is still
            // set: a tower whose location was never surveyed is normally still
            // known to be IN a district, and leaving it null here would make
            // the null case untestable in the other direction.
            $kecamatan = KecamatanSemarang::random();
            
            $towers[] = [
                'site_id' => 'SITE' . str_pad($counter, 4, '0', STR_PAD_LEFT),
                'site_sap' => 'SAP' . str_pad($counter, 5, '0', STR_PAD_LEFT),
                'site_name' => 'Tower Site ' . $counter . ' (No Coordinates)',
                'longitude' => null, // No coordinates
                'latitude' => null, // No coordinates
                'tinggi_menara' => rand(30, 120) + (rand(0, 99) / 100),
                'tinggi_bangunan' => rand(0, 50) + (rand(0, 99) / 100),
                'jumlah_pengguna' => rand(100, 5000),
                'jumlah_kaki' => rand(3, 4),
                'alamat_menara' => 'Jl. Dummy No. ' . $counter . ', Kec. ' . $kecamatan . ', Kabupaten Semarang',
                'kecamatan' => $kecamatan,
                'tower_type' => $towerTypes[array_rand($towerTypes)],
                'site_type' => $siteTypes[array_rand($siteTypes)],
                'no_ijin' => 'IJIN/' . date('Y') . '/' . str_pad($counter, 4, '0', STR_PAD_LEFT),
                'tanggal_ijin' => $tanggalIjin->format('Y-m-d'),
                'berlaku_hingga' => $berlakuHingga->format('Y-m-d'),
                'jenis_ijin' => $jenisIjin[array_rand($jenisIjin)],
                'status_ijin' => $statusIjin[array_rand($statusIjin)],
                'prs' => 'PRS-' . str_pad($counter, 3, '0', STR_PAD_LEFT),
                'prs_id' => 'PRSID' . str_pad($counter, 4, '0', STR_PAD_LEFT),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Insert towers in chunks
        $chunks = array_chunk($towers, 100);
        foreach ($chunks as $chunk) {
            DB::table('towers')->insert($chunk);
        }
        
        $this->command->info('Inserted ' . count($towers) . ' towers without coordinates');
    }
}
