<?php

namespace Database\Seeders;

use App\Models\FoPoint;
use App\Models\FoProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates master providers and assigns them to FO points via pivot table.
     * Providers: Diskominfo, MyRepublic, Indihome, IConnect
     * One point can have multiple providers.
     * 
     * IMPORTANT: Only assigns providers to FO points that have ISP image.
     * Valid conditions: "ISP Saja", "Pole + ISP", "Pole + ISP + JB"
     */
    public function run(): void
    {
        $this->command->info('Creating master providers and assigning to FO points...');

        // Define default master providers
        $providersData = [
            [
                'name' => 'Diskominfo',
                'description' => 'Dinas Komunikasi dan Informatika',
                'default_sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'MyRepublic',
                'description' => 'MyRepublic Indonesia',
                'default_sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Indihome',
                'description' => 'Indihome by Telkom Indonesia',
                'default_sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'IConnect',
                'description' => 'IConnect Internet Service Provider',
                'default_sort_order' => 4,
                'is_active' => true,
            ],
        ];

        DB::beginTransaction();

        try {
            // Step 1: Create or update master providers
            $masterProviders = [];
            foreach ($providersData as $providerData) {
                $provider = FoProvider::updateOrCreate(
                    ['name' => $providerData['name']],
                    $providerData
                );
                $masterProviders[$provider->name] = $provider;
                $this->command->info("  ✓ Master provider '{$provider->name}' created/updated");
            }

            // Step 2: Get FO points that have ISP image (valid ISP)
            // Only points with ISP image should get providers:
            // - "ISP Saja": has isp_image only
            // - "Pole + ISP": has isp_image and pole_image
            // - "Pole + ISP + JB": has isp_image, pole_image, and junction_box_image
            $foPoints = FoPoint::where('status', 'active')
                ->whereNotNull('isp_image')
                ->where('isp_image', '!=', '')
                ->where('isp_image', '!=', '-')
                ->get();

            if ($foPoints->isEmpty()) {
                $this->command->warn('No FO points with ISP image found. Skipping provider assignment.');
                $this->command->info('Only FO points with ISP image (ISP Saja, Pole + ISP, Pole + ISP + JB) will get providers.');
                DB::commit();
                return;
            }

            $totalPointsWithIsp = $foPoints->count();
            $this->command->info("Found {$totalPointsWithIsp} FO points with ISP image.");
            $this->command->info('Assigning providers to FO points...');

            // Step 3: Assign providers to FO points via pivot table
            // Each point can have 1-3 random providers
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
                
                // Determine how many providers to assign (1-3 providers per point total)
                $targetProviders = rand(1, 3);
                $neededProviders = max(1, $targetProviders - count($existingProviderIds));
                
                // Get available master providers (excluding existing ones)
                $availableProviders = collect($masterProviders)
                    ->filter(function($provider) use ($existingProviderIds) {
                        return !in_array($provider->id, $existingProviderIds);
                    })
                    ->shuffle();
                
                // Select new providers to add
                $newProviders = $availableProviders->take($neededProviders);
                
                // Build sync data for pivot table
                $providerIds = $newProviders->pluck('id')->toArray();
                $syncData = FoProvider::buildSyncData($providerIds);
                $totalAssignments += count($syncData);
                
                // Sync providers to point (this will add new ones without removing existing)
                if (!empty($syncData)) {
                    $point->providers()->syncWithoutDetaching($syncData);
                    $assignedCount++;
                }
            }

            DB::commit();

            $this->command->info("Successfully assigned providers to {$assignedCount} FO points (with ISP image).");
            $this->command->info("Total provider assignments: {$totalAssignments}");
            if ($skippedCount > 0) {
                $this->command->info("Skipped {$skippedCount} points that already have 3 or more providers.");
            }

            // Show statistics
            $this->showStatistics();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error creating/assigning providers: ' . $e->getMessage());
            $this->command->error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Display statistics about FO points and providers assignment.
     */
    private function showStatistics(): void
    {
        $totalPoints = FoPoint::where('status', 'active')->count();
        
        // Count points with ISP image (eligible for providers)
        $pointsWithIsp = FoPoint::where('status', 'active')
            ->whereNotNull('isp_image')
            ->where('isp_image', '!=', '')
            ->where('isp_image', '!=', '-')
            ->count();
        
        $pointsWithProviders = FoPoint::where('status', 'active')
            ->whereHas('providers')
            ->count();
        $pointsWithoutProviders = $totalPoints - $pointsWithProviders;

        $totalRoutes = \App\Models\FoRoute::where('status', 'active')->count();
        $routesWithProviders = \App\Models\FoRoute::where('status', 'active')
            ->hasProviders()
            ->count();

        // Show provider distribution by master provider
        $masterProviders = FoProvider::active()
            ->orderBy('default_sort_order')
            ->orderBy('name')
            ->get();
        $providerStats = [];
        
        foreach ($masterProviders as $masterProvider) {
            // Query points that have this provider via pivot table using whereExists
            $pointsCount = FoPoint::where('status', 'active')
                ->whereExists(function($query) use ($masterProvider) {
                    $query->select(DB::raw(1))
                        ->from('fo_point_provider')
                        ->whereColumn('fo_point_provider.fo_point_id', 'fo_points.id')
                        ->where('fo_point_provider.fo_provider_id', $masterProvider->id)
                        ->where('fo_point_provider.is_active', true);
                })
                ->count();
            $providerStats[$masterProvider->name] = $pointsCount;
        }

        $this->command->newLine();
        $this->command->info('=== FO Points & Providers Statistics ===');
        $this->command->line("Total active FO points: {$totalPoints}");
        $this->command->line("Points with ISP image (eligible for providers): {$pointsWithIsp}");
        $this->command->line("Points without ISP image (not eligible): " . ($totalPoints - $pointsWithIsp));
        $this->command->line("Points with providers: {$pointsWithProviders}");
        $this->command->line("Points without providers: {$pointsWithoutProviders}");
        $this->command->newLine();
        $this->command->info('Provider Distribution (only points with ISP image):');
        foreach ($providerStats as $providerName => $count) {
            $percentage = $pointsWithIsp > 0 ? round(($count / $pointsWithIsp) * 100, 1) : 0;
            $this->command->line("  - {$providerName}: {$count} points ({$percentage}% of points with ISP)");
        }
        $this->command->newLine();
        $this->command->line("Total active routes: {$totalRoutes}");
        $this->command->line("Routes with providers (will be visible): {$routesWithProviders}");
        $this->command->line("Routes without providers (will be hidden): " . ($totalRoutes - $routesWithProviders));
    }
}
