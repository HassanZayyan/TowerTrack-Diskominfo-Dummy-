<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OwnerSeeder extends Seeder
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

        $owners = [];
        $handle = fopen($csvFile, 'r');
        
        // Skip header row
        fgetcsv($handle);
        
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= 3) {
                $ownerName = trim($row[1]); // OWNER column
                $ownerAddress = trim($row[2]); // ALAMAT OWNER column
                
                if (!empty($ownerName)) {
                    $key = $ownerName . '|' . $ownerAddress;
                    $owners[$key] = [
                        'name' => $ownerName,
                        'alamat' => $ownerAddress ?: 'Alamat tidak tersedia',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }
        
        fclose($handle);
        
        // Insert unique owners
        DB::table('owners')->insert(array_values($owners));
        
        $this->command->info('Inserted ' . count($owners) . ' unique owners');
    }
}
