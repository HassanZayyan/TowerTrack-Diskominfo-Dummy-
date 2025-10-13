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
        
        // Note: GeoJSON routes are NOT pre-generated during seeding
        // They will be generated ON-DEMAND when users select routes in the UI
        // This saves OpenRouteService API tokens (70-80% savings)
        // 
        // If you need to manually generate all routes, run:
        // php artisan db:seed --class=GenerateGeoJsonRoutesSeeder --force
    }
}
