<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TowerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvFile = database_path('../Data_menara_rev.csv');
        
        if (!file_exists($csvFile)) {
            $this->command->error('CSV file not found: ' . $csvFile);
            return;
        }

        $towers = [];
        $handle = fopen($csvFile, 'r');
        
        // Skip header row
        fgetcsv($handle);
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= 13) { // Ensure minimum required columns
                // Parse longitude and latitude
                $longitude = !empty(trim($row[6])) ? (float) trim($row[6]) : null;
                $latitude = !empty(trim($row[7])) ? (float) trim($row[7]) : null;
                
                // Parse dates
                $tanggalIjin = null;
                $berlakuHingga = null;
                
                if (!empty(trim($row[16]))) {
                    try {
                        $tanggalIjin = Carbon::createFromFormat('d/m/Y', trim($row[16]))->format('Y-m-d');
                    } catch (\Exception $e) {
                        // If date parsing fails, leave as null
                    }
                }
                
                if (!empty(trim($row[17]))) {
                    try {
                        $berlakuHingga = Carbon::createFromFormat('d/m/Y', trim($row[17]))->format('Y-m-d');
                    } catch (\Exception $e) {
                        // If date parsing fails, leave as null
                    }
                }
                
                $towers[] = [
                    'site_id' => !empty(trim($row[3])) ? trim($row[3]) : null,
                    'site_sap' => !empty(trim($row[4])) ? trim($row[4]) : null,
                    'site_name' => trim($row[5]) ?: 'Site Name ' . (count($towers) + 1),
                    'longitude' => $longitude,
                    'latitude' => $latitude,
                    'tinggi_menara' => !empty(trim($row[8])) ? (float) trim($row[8]) : null,
                    'tinggi_bangunan' => !empty(trim($row[9])) ? (float) trim($row[9]) : null,
                    'jumlah_pengguna' => !empty(trim($row[10])) ? (int) trim($row[10]) : null,
                    'jumlah_kaki' => !empty(trim($row[11])) ? (int) trim($row[11]) : null,
                    'alamat_menara' => trim($row[12]) ?: 'Alamat tidak tersedia',
                    'tower_type' => !empty(trim($row[13])) ? trim($row[13]) : null,
                    'site_type' => !empty(trim($row[14])) ? trim($row[14]) : null,
                    'no_ijin' => !empty(trim($row[15])) ? trim($row[15]) : null,
                    'tanggal_ijin' => $tanggalIjin,
                    'berlaku_hingga' => $berlakuHingga,
                    'jenis_ijin' => !empty(trim($row[18])) ? trim($row[18]) : null,
                    'status_ijin' => !empty(trim($row[19])) ? trim($row[19]) : null,
                    'prs' => !empty(trim($row[20])) ? trim($row[20]) : null,
                    'prs_id' => !empty(trim($row[21])) ? trim($row[21]) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        fclose($handle);
        
        // Insert towers in chunks to avoid memory issues
        $chunks = array_chunk($towers, 100);
        foreach ($chunks as $chunk) {
            DB::table('towers')->insert($chunk);
        }
        
        $this->command->info('Inserted ' . count($towers) . ' towers');
    }
}
