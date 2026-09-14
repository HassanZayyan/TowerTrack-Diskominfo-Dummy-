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
     * Seed Tower-Owner relationships with dummy data
     */
    private function seedTowerOwners(): void
    {
        // Clear existing relationships first
        DB::table('tower_owners')->truncate();
        $this->command->info('Cleared existing tower-owner relationships');

        // Get all owners and towers
        $owners = Owner::all();
        $towers = Tower::all();
        
        if ($owners->isEmpty()) {
            $this->command->error('No owners found. Run OwnerSeeder first.');
            return;
        }
        
        if ($towers->isEmpty()) {
            $this->command->error('No towers found. Run TowerSeeder first.');
            return;
        }
        
        $this->command->info('Loaded ' . $owners->count() . ' owners');
        $this->command->info('Loaded ' . $towers->count() . ' towers');

        $towerOwners = [];
        
        // Assign owners to towers randomly
        // Each tower can have 1-2 owners
        foreach ($towers as $tower) {
            $numOwners = rand(1, 2);
            $selectedOwners = $owners->random(min($numOwners, $owners->count()));
            
            foreach ($selectedOwners as $owner) {
                $key = $tower->id . '_' . $owner->id;
                if (!isset($towerOwners[$key])) {
                    $towerOwners[$key] = [
                        'tower_id' => $tower->id,
                        'owner_id' => $owner->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }
        
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
            
            $this->command->info("Successfully inserted {$totalInserted} dummy tower-owner relationships");
        } else {
            $this->command->warn('No tower-owner relationships to insert');
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
