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
     */
    public function run(): void
    {
        $this->command->info('🔄 Generating GeoJSON routes...');
        
        // Check if API key is configured
        if (empty(config('services.openrouteservice.api_key'))) {
            $this->command->warn('⚠️  OpenRouteService API key not configured. Using fallback route generation.');
        } else {
            $this->command->line('✅ Using OpenRouteService API for accurate routing.');
        }
        
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
                $this->command->line('✅ All routes generated successfully!');
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
