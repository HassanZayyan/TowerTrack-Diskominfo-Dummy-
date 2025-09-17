<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Add banned column to users table if it doesn't exist
        $this->call([
            AddBannedColumnSeeder::class,
        ]);
        
        // Seed users first
        $this->call([
            UserSeeder::class,
        ]);

        // Seed tower data from CSV
        $this->call([
            OwnerSeeder::class,
            TowerSeeder::class,
            TowerOwnerSeeder::class,
            StatusSeeder::class,
        ]);
        
        // Seed tower owner user accounts (must be after OwnerSeeder)
        $this->call([
            TowerOwnerUserSeeder::class,
        ]);

        // Seed FO points and routes from CSV/images
        $this->call([
            FoPointsFromCsvSeeder::class,
            FoRoutesFromPointsSeeder::class,
        ]);
    }
}
