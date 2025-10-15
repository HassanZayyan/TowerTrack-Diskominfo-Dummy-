<?php

namespace Database\Seeders;

use App\Services\FoRouteGenerationService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class GenerateGeoJsonRoutesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * ⚠️  IMPORTANT: This seeder is NOT called automatically in DatabaseSeeder!
     * 
     * GeoJSON routes are generated ON-DEMAND when users click routes in the UI.
     * This seeder is ONLY for manual pre-generation if absolutely needed.
     * 
     * AUTOMATIC (Recommended - 0 tokens):
     *   - Do nothing! Routes generate when users click them
     *   - Saves 70-80% of API tokens
     *   - Better for most use cases
     * 
     * MANUAL PRE-GENERATION (Not recommended - costs 17 tokens):
     *   php artisan db:seed --class=GenerateGeoJsonRoutesSeeder --force
     */
    public function run(): void
    {
        $this->command->newLine();
        $this->command->info('╔═══════════════════════════════════════════════════════════╗');
        $this->command->info('║   🚨 GeoJSON Route Generation - Manual Seeder Only       ║');
        $this->command->info('╚═══════════════════════════════════════════════════════════╝');
        $this->command->newLine();
        
        // Check if API key is configured
        if (empty(config('services.openrouteservice.api_key'))) {
            $this->command->warn('⚠️  OpenRouteService API key not configured.');
            $this->command->line('   Routes will use fallback polyline generation.');
        } else {
            $this->command->line('✅ OpenRouteService API configured and ready.');
        }
        
        $this->command->newLine();
        $this->command->info('ℹ️  Current Strategy (Recommended):');
        $this->command->line('   • Routes are generated ON-DEMAND when users click them in UI');
        $this->command->line('   • No tokens consumed during database setup');
        $this->command->line('   • Only clicked routes consume 1 token each');
        $this->command->line('   • Generated routes cached for 24 hours');
        $this->command->line('   • Typical savings: 70-80% of API tokens');
        
        $this->command->newLine();
        
        // Check if force flag is provided to pre-generate
        $forceGenerate = $this->command->option('force') ?? false;
        
        if (!$forceGenerate) {
            $this->command->info('✅ SKIPPED - No pre-generation (this is correct!)');
            $this->command->newLine();
            $this->command->line('   🎯 Routes will be generated on-demand when users select them.');
            $this->command->line('   💰 Tokens saved: 17 (0 consumed now, generated only when needed)');
            $this->command->newLine();
            $this->command->line('   🔧 If you really need to pre-generate all routes:');
            $this->command->line('   php artisan db:seed --class=GenerateGeoJsonRoutesSeeder --force');
            $this->command->newLine();
            $this->command->warn('   ⚠️  Pre-generation NOT recommended - wastes tokens on unused routes!');
            return;
        }
        
        // Only pre-generate if explicitly confirmed or forced
        $this->command->warn('⚠️  Pre-generating all routes...');
        $this->command->line('   This will consume OpenRouteService API credits.');
        
        try {
            $routeService = app(FoRouteGenerationService::class);
            
            // Generate routes for each area
            $areas = ['ungaran', 'ambarawa'];
            $totalSuccess = 0;
            $totalFailed = 0;
            $totalSkipped = 0;
            $totalRoutes = 0;
            
            foreach ($areas as $area) {
                $this->command->line("📍 Generating routes for area: {$area}");
                
                $results = $routeService->regenerateAllRoutes($area);
                
                $totalSuccess += $results['success'];
                $totalFailed += $results['failed'];
                $totalSkipped += $results['skipped'];
                $totalRoutes += $results['total'];
                
                $this->command->line("   ✅ Success: {$results['success']} | ❌ Failed: {$results['failed']} | ⏭️  Skipped: {$results['skipped']}");
                
                // Small delay between areas to avoid overwhelming the API
                if (count($areas) > 1) {
                    sleep(1);
                }
            }
            
            $this->command->newLine();
            $this->command->info('🎉 GeoJSON Route Generation Summary:');
            $this->command->table(['Metric', 'Count'], [
                ['Total Routes', $totalRoutes],
                ['Successfully Generated', $totalSuccess],
                ['Failed', $totalFailed],
                ['Skipped (Already Generated)', $totalSkipped],
            ]);
            
            if ($totalFailed > 0) {
                $this->command->warn("⚠️  {$totalFailed} routes failed to generate. Check logs for details.");
                Log::warning("Route generation seeder completed with {$totalFailed} failures");
            } else {
                $this->command->line('✅ All routes pre-generated successfully!');
                Log::info("Route generation seeder completed successfully. Generated {$totalSuccess} routes.");
            }
            
        } catch (\Exception $e) {
            $this->command->error("❌ Error during route generation: {$e->getMessage()}");
            Log::error("Route generation seeder failed: {$e->getMessage()}", [
                'exception' => $e
            ]);
        }
    }
}
