<?php

namespace Database\Seeders;

use App\Models\Owner;
use App\Models\Tower;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TowerOwnerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Optimized version:
     * - Uses Eloquent models instead of DB facade
     * - Caches owners to avoid repeated queries
     * - Batch inserts for better performance
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
        
        // Pre-load owners for better performance (cache)
        // Group by name+address for exact match, and also index by name for fallback
        $ownersByKey = [];
        $ownersByName = [];
        
        Owner::all()->each(function($owner) use (&$ownersByKey, &$ownersByName) {
            $key = $owner->name . '|' . $owner->alamat;
            $ownersByKey[$key] = $owner;
            
            // Index by name for fallback lookup
            if (!isset($ownersByName[$owner->name])) {
                $ownersByName[$owner->name] = [];
            }
            $ownersByName[$owner->name][] = $owner;
        });
        
        $this->command->info('Loaded ' . count($ownersByKey) . ' owners into cache');

        $towerOwners = [];
        $processedRows = 0;
        $notFoundTowers = [];
        $notFoundOwners = [];
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= 13) {
                $processedRows++;
                $ownerName = trim($row[1]); // OWNER column
                $ownerAddress = trim($row[2] ?: 'Alamat tidak tersedia'); // ALAMAT OWNER column
                $siteName = trim($row[5]); // SITE NAME column
                $longitudeRaw = trim($row[6] ?? ''); // LONGITUDE column
                $latitudeRaw = trim($row[7] ?? ''); // LATTITUDE column
                
                if (!empty($ownerName) && !empty($siteName)) {
                    // Find owner using cache (more efficient)
                    // First try exact match (name + address)
                    $key = $ownerName . '|' . $ownerAddress;
                    $owner = $ownersByKey[$key] ?? null;
                    
                    // Fallback: find by name only (take first match)
                    if (!$owner && isset($ownersByName[$ownerName])) {
                        $owner = $ownersByName[$ownerName][0];
                    }
                    
                    if ($owner) {
                        // Find tower using Eloquent model
                        $towerQuery = Tower::where('site_name', $siteName);

                        // If we have valid numeric coordinates, include them for precise matching
                        $lon = is_numeric($longitudeRaw) ? (float)$longitudeRaw : null;
                        $lat = is_numeric($latitudeRaw) ? (float)$latitudeRaw : null;
                        
                        if ($lat !== null && $lon !== null) {
                            $towerQuery->where('latitude', $lat)
                                      ->where('longitude', $lon);
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
        
        // Batch insert tower-owner relationships in chunks
        if (!empty($towerOwners)) {
            $chunks = array_chunk(array_values($towerOwners), 100);
            $totalInserted = 0;
            
            foreach ($chunks as $chunk) {
                try {
                    DB::table('tower_owners')->insert($chunk);
                    $totalInserted += count($chunk);
                } catch (\Exception $e) {
                    $this->command->error("Failed to insert chunk: " . $e->getMessage());
                }
            }
            
            $this->command->info("Successfully inserted {$totalInserted} tower-owner relationships");
        } else {
            $this->command->warn('No tower-owner relationships to insert');
        }
        
        $this->command->info('Processed ' . $processedRows . ' CSV rows');
        
        if (!empty($notFoundTowers)) {
            $this->command->warn('Towers not found: ' . count($notFoundTowers));
            foreach (array_slice($notFoundTowers, 0, 5) as $warning) {
                $this->command->warn('  ' . $warning);
            }
            if (count($notFoundTowers) > 5) {
                $this->command->warn('  ... and ' . (count($notFoundTowers) - 5) . ' more');
            }
        }
        
        if (!empty($notFoundOwners)) {
            $this->command->warn('Owners not found: ' . count($notFoundOwners));
            foreach (array_slice($notFoundOwners, 0, 5) as $warning) {
                $this->command->warn('  ' . $warning);
            }
            if (count($notFoundOwners) > 5) {
                $this->command->warn('  ... and ' . (count($notFoundOwners) - 5) . ' more');
            }
        }
    }
}
