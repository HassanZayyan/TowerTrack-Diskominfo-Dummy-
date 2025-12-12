<?php

namespace Database\Seeders;

use App\Models\Owner;
use App\Models\Tower;
use App\Models\FoPoint;
use App\Models\FoProvider;
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
     * - Also handles FO Point-Provider relationships
     */
    public function run(): void
    {
        // Run Tower-Owner seeding
        $this->seedTowerOwners();
        
        // Run FO Point-Provider seeding
        $this->seedFoPointProviders();
    }

    /**
     * Seed Tower-Owner relationships from CSV
     */
    private function seedTowerOwners(): void
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

    /**
     * Seed FO Point-Provider relationships with realistic variations
     * Assigns providers to FO Points based on area, route, and ISP image availability
     */
    private function seedFoPointProviders(): void
    {
        $this->command->newLine();
        $this->command->info('=== Starting FO Point-Provider Assignment ===');

        // Get all active providers
        $providers = FoProvider::where('is_active', true)
            ->orderBy('default_sort_order')
            ->orderBy('name')
            ->get();

        if ($providers->isEmpty()) {
            $this->command->warn('No active providers found. Run ProviderSeeder first.');
            return;
        }

        $this->command->info('Found ' . $providers->count() . ' active providers: ' . $providers->pluck('name')->join(', '));

        // Get FO Points that have ISP image (eligible for providers)
        $foPoints = FoPoint::where('status', 'active')
            ->whereNotNull('isp_image')
            ->where('isp_image', '!=', '')
            ->where('isp_image', '!=', '-')
            ->get();

        if ($foPoints->isEmpty()) {
            $this->command->warn('No FO Points with ISP image found. Skipping provider assignment.');
            return;
        }

        $this->command->info('Found ' . $foPoints->count() . ' FO Points with ISP image (eligible for providers)');

        // Group providers by area and route for realistic distribution
        $providerDistribution = $this->calculateProviderDistribution($foPoints, $providers);

        $assignedCount = 0;
        $skippedCount = 0;
        $totalAssignments = 0;

        foreach ($foPoints as $point) {
            // Get existing provider IDs for this point
            $existingProviderIds = $point->providers()->pluck('fo_providers.id')->toArray();

            // If point already has 3 or more providers, skip
            if (count($existingProviderIds) >= 3) {
                $skippedCount++;
                continue;
            }

            // Determine providers to assign based on area and route
            $recommendedProviders = $providerDistribution[$point->area][$point->route_name] ?? [];
            
            // If no recommended providers for this area/route, assign randomly
            if (empty($recommendedProviders)) {
                $availableProviders = $providers->shuffle()->take(rand(1, 3));
            } else {
                // Use recommended providers but shuffle for variation
                $availableProviders = collect($recommendedProviders)->shuffle();
            }

            // Filter out existing providers
            $newProviders = $availableProviders->filter(function($provider) use ($existingProviderIds) {
                return !in_array($provider->id, $existingProviderIds);
            });

            // Determine how many providers to assign (1-3 total)
            $targetProviders = rand(1, 3);
            $neededProviders = max(1, $targetProviders - count($existingProviderIds));
            $newProviders = $newProviders->take($neededProviders);

            // Build sync data for pivot table
            $providerIds = $newProviders->pluck('id')->toArray();
            $syncData = FoProvider::buildSyncData($providerIds);
            $totalAssignments += count($syncData);

            // Sync providers to point (add new ones without removing existing)
            if (!empty($syncData)) {
                $point->providers()->syncWithoutDetaching($syncData);
                $assignedCount++;
            }
        }

        $this->command->info("Successfully assigned providers to {$assignedCount} FO Points");
        $this->command->info("Total provider assignments: {$totalAssignments}");
        if ($skippedCount > 0) {
            $this->command->info("Skipped {$skippedCount} points that already have 3 or more providers");
        }

        // Show statistics
        $this->showFoPointProviderStatistics($foPoints, $providers);
    }

    /**
     * Calculate realistic provider distribution based on area and route
     */
    private function calculateProviderDistribution($foPoints, $providers): array
    {
        $distribution = [];
        
        // Group points by area and route
        $pointsByAreaRoute = [];
        foreach ($foPoints as $point) {
            $area = $point->area ?? 'ungaran';
            $route = $point->route_name ?? 'default';
            
            if (!isset($pointsByAreaRoute[$area])) {
                $pointsByAreaRoute[$area] = [];
            }
            if (!isset($pointsByAreaRoute[$area][$route])) {
                $pointsByAreaRoute[$area][$route] = [];
            }
            $pointsByAreaRoute[$area][$route][] = $point;
        }

        // Assign providers to each area/route combination
        // More variety: each route gets 1-3 different providers
        foreach ($pointsByAreaRoute as $area => $routes) {
            $distribution[$area] = [];
            
            foreach ($routes as $route => $points) {
                // Assign 1-3 providers per route (shuffled)
                $numProviders = min(rand(1, 3), $providers->count());
                $routeProviders = $providers->shuffle()->take($numProviders);
                $distribution[$area][$route] = $routeProviders->all();
            }
        }

        return $distribution;
    }

    /**
     * Show statistics about FO Point-Provider assignments
     */
    private function showFoPointProviderStatistics($foPoints, $providers): void
    {
        $totalPoints = FoPoint::where('status', 'active')->count();
        
        $pointsWithProviders = FoPoint::where('status', 'active')
            ->whereHas('providers')
            ->count();
        
        $pointsWithoutProviders = $totalPoints - $pointsWithProviders;

        $this->command->newLine();
        $this->command->info('=== FO Point-Provider Statistics ===');
        $this->command->line("Total active FO Points: {$totalPoints}");
        $this->command->line("Points with ISP image (eligible): " . $foPoints->count());
        $this->command->line("Points with providers: {$pointsWithProviders}");
        $this->command->line("Points without providers: {$pointsWithoutProviders}");
        
        $this->command->newLine();
        $this->command->info('Provider Distribution:');
        foreach ($providers as $provider) {
            $pointsCount = FoPoint::where('status', 'active')
                ->whereHas('providers', function($query) use ($provider) {
                    $query->where('fo_providers.id', $provider->id)
                          ->where('fo_point_provider.is_active', true);
                })
                ->count();
            
            $percentage = $foPoints->count() > 0 ? round(($pointsCount / $foPoints->count()) * 100, 1) : 0;
            $this->command->line("  - {$provider->name}: {$pointsCount} points ({$percentage}% of eligible points)");
        }
        $this->command->newLine();
    }
}
