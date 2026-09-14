<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clean up user-uploaded files from storage before seeding
        $this->cleanupStorageFiles();

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
                // Seed tower owner user accounts (must be after OwnerSeeder, before ReportFeedbackSeeder)
            TowerOwnerUserSeeder::class,
            StatusSeeder::class,
        ]);

        // Seed FO points first (required by ReportFeedbackSeeder)
        $this->call([
            FoPointsFromCsvSeeder::class,
            SeminarDummySeeder::class,
        ]);

        // Sample reports and feedbacks (requires TowerOwnerUserSeeder and FoPointsFromCsvSeeder)
        $this->call([
            ReportFeedbackSeeder::class,
        ]);

        // Seed FO providers and routes (must be after FoPointsFromCsvSeeder)
        $this->call([
            ProviderSeeder::class, // Create master providers and assign to points (must be after FoPointsFromCsvSeeder)
            ProviderOwnerUserSeeder::class, // Create provider owner users (must be after ProviderSeeder)
            FoRoutesFromPointsSeeder::class,
        ]);

        // Note: GeoJSON routes are NOT pre-generated during seeding
        // They will be generated ON-DEMAND when users select routes in the UI
        // This saves OpenRouteService API tokens (70-80% savings)
        // 
        // If you need to manually generate all routes, run:
        // php artisan db:seed --class=GenerateGeoJsonRoutesSeeder --force
    }

    /**
     * Clean up all user-uploaded files from storage.
     * This prevents orphaned files after fresh seed and improves performance.
     */
    private function cleanupStorageFiles(): void
    {
        $this->command->info('🧹 Cleaning up storage files...');

        $directories = [
            'report-photos',
            'report-videos',
            'feedback-photos',
            'feedback-videos',
            'feedback-response-photos',
            'feedback-response-videos',
            'admin-response-photos',
            'admin-response-videos',
            'avatars',
            'complaint-response-photos',
        ];

        $totalDeleted = 0;

        foreach ($directories as $directory) {
            if (Storage::disk('public')->exists($directory)) {
                $files = Storage::disk('public')->allFiles($directory);
                $count = count($files);

                if ($count > 0) {
                    Storage::disk('public')->deleteDirectory($directory);
                    Storage::disk('public')->makeDirectory($directory);
                    $totalDeleted += $count;
                    $this->command->info("  ✓ Deleted {$count} files from {$directory}/");
                }
            }
        }

        if ($totalDeleted > 0) {
            $this->command->info("✓ Total: {$totalDeleted} files deleted");
        } else {
            $this->command->info("✓ No files to clean");
        }
    }
}
