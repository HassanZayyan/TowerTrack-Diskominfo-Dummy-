<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TowerOwnerSeeder extends Seeder
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

        // Clear existing relationships first
        DB::table('tower_owners')->truncate();
        $this->command->info('Cleared existing tower-owner relationships');

        $handle = fopen($csvFile, 'r');
        
        // Skip header row
        fgetcsv($handle);
        
        $towerOwners = [];
        $processedRows = 0;
        $notFoundTowers = [];
        $notFoundOwners = [];
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= 13) {
                $processedRows++;
                $ownerName = trim($row[1]); // OWNER column
                $ownerAddress = trim($row[2]); // ALAMAT OWNER column
                $siteName = trim($row[5]); // SITE NAME column
                $longitudeRaw = trim($row[6] ?? ''); // LONGITUDE column
                $latitudeRaw = trim($row[7] ?? ''); // LATTITUDE column
                $alamatMenara = trim($row[12]); // ALAMAT MENARA column
                
                if (!empty($ownerName) && !empty($siteName)) {
                    // Find owner by name and address
                    $owner = DB::table('owners')
                        ->where('name', $ownerName)
                        ->where('alamat', $ownerAddress ?: 'Alamat tidak tersedia')
                        ->first();
                    
                    if (!$owner) {
                        // Try finding by name only if exact match fails
                        $owner = DB::table('owners')
                            ->where('name', $ownerName)
                            ->first();
                    }
                    
                    if ($owner) {
                        // Build strict tower matcher
                        $towerQuery = DB::table('towers')->where('site_name', $siteName);

                        // If we have valid numeric coordinates, include them for precise matching
                        $lon = is_numeric($longitudeRaw) ? (float)$longitudeRaw : null;
                        $lat = is_numeric($latitudeRaw) ? (float)$latitudeRaw : null;
                        if ($lat !== null && $lon !== null) {
                            $towerQuery->where('latitude', $lat)->where('longitude', $lon);
                        }

                        $tower = $towerQuery->first();
                        
                        if ($tower) {
                            $key = $tower->id . '_' . $owner->id;
                            if (!isset($towerOwners[$key])) {
                                $towerOwners[$key] = [
                                    'tower_id' => $tower->id,
                                    'owner_id' => $owner->id,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ];
                            }
                        } else {
                            $notFoundTowers[] = "Row {$processedRows}: Tower '{$siteName}' not found (coords: {$latitudeRaw},{$longitudeRaw})";
                        }
                    } else {
                        $notFoundOwners[] = "Row {$processedRows}: Owner '{$ownerName}' not found";
                    }
                }
            }
        }
        
        fclose($handle);
        
        // Insert tower-owner relationships in chunks
        if (!empty($towerOwners)) {
            $chunks = array_chunk(array_values($towerOwners), 100);
            foreach ($chunks as $chunk) {
                try {
                    DB::table('tower_owners')->insert($chunk);
                } catch (\Exception $e) {
                    $this->command->error("Failed to insert chunk: " . $e->getMessage());
                }
            }
        }
        
        $this->command->info('Processed ' . $processedRows . ' CSV rows');
        $this->command->info('Successfully inserted ' . count($towerOwners) . ' tower-owner relationships');
        
        if (!empty($notFoundTowers)) {
            $this->command->warn('Towers not found: ' . count($notFoundTowers));
            foreach (array_slice($notFoundTowers, 0, 5) as $warning) {
                $this->command->warn($warning);
            }
        }
        
        if (!empty($notFoundOwners)) {
            $this->command->warn('Owners not found: ' . count($notFoundOwners));
            foreach (array_slice($notFoundOwners, 0, 5) as $warning) {
                $this->command->warn($warning);
            }
        }
    }
}
