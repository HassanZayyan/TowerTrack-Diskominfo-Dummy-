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

        $handle = fopen($csvFile, 'r');
        
        // Skip header row
        fgetcsv($handle);
        
        $towerOwners = [];
        $processedRows = 0;
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= 13) {
                $ownerName = trim($row[1]); // OWNER column
                $ownerAddress = trim($row[2]); // ALAMAT OWNER column
                $siteName = trim($row[5]); // SITE NAME column
                $alamatMenara = trim($row[12]); // ALAMAT MENARA column
                
                if (!empty($ownerName) && !empty($siteName)) {
                    // Find owner by name and address
                    $owner = DB::table('owners')
                        ->where('name', $ownerName)
                        ->where('alamat', $ownerAddress ?: 'Alamat tidak tersedia')
                        ->first();
                    
                    if ($owner) {
                        // Find tower by site_name and alamat_menara
                        $tower = DB::table('towers')
                            ->where('site_name', $siteName ?: 'Site Name ' . ($processedRows + 1))
                            ->where('alamat_menara', $alamatMenara ?: 'Alamat tidak tersedia')
                            ->first();
                        
                        if ($tower) {
                            $towerOwners[] = [
                                'tower_id' => $tower->id,
                                'owner_id' => $owner->id,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        } else {
                            $this->command->warn("Tower not found for site: {$siteName}");
                        }
                    } else {
                        $this->command->warn("Owner not found: {$ownerName}");
                    }
                }
                $processedRows++;
            }
        }
        
        fclose($handle);
        
        // Remove duplicates
        $uniqueTowerOwners = [];
        foreach ($towerOwners as $towerOwner) {
            $key = $towerOwner['tower_id'] . '_' . $towerOwner['owner_id'];
            $uniqueTowerOwners[$key] = $towerOwner;
        }
        
        // Insert tower-owner relationships in chunks
        $chunks = array_chunk(array_values($uniqueTowerOwners), 100);
        foreach ($chunks as $chunk) {
            DB::table('tower_owners')->insert($chunk);
        }
        
        $this->command->info('Inserted ' . count($uniqueTowerOwners) . ' tower-owner relationships');
    }
}
