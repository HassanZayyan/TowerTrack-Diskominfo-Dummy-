<?php

namespace App\Console\Commands;

use App\Services\FoRouteGenerationService;
use Illuminate\Console\Command;

class GenerateFoRoutes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fo:generate-routes {--area= : Generate routes for specific area only} {--force : Force regenerate even if up-to-date}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate GeoJSON routes for FO routes using routing service';

    /**
     * Execute the console command.
     */
    public function handle(FoRouteGenerationService $routeService)
    {
        $area = $this->option('area');
        $force = (bool) $this->option('force');
        
        $this->info('Starting FO route generation...');
        
        if ($area) {
            $this->info("Generating routes for area: {$area}");
        } else {
            $this->info('Generating routes for all areas');
        }
        
        // Check API configuration
        if (empty(config('services.openrouteservice.api_key'))) {
            $this->warn('OpenRouteService API key not configured. Using fallback route generation.');
        } else {
            $this->comment('Using OpenRouteService API for accurate routing.');
        }
        
        $results = $routeService->regenerateAllRoutes($area, $force);
        
        $this->newLine();
        $this->info('Route generation completed!');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Routes', $results['total']],
                ['Successfully Generated', $results['success']],
                ['Failed', $results['failed']],
                ['Skipped (Already Up-to-date)', $results['skipped']],
            ]
        );
        
        if ($results['failed'] > 0) {
            $this->warn("Warning: {$results['failed']} routes failed to generate. Check logs for details.");
            return Command::FAILURE;
        }
        
        if ($results['success'] === 0 && $results['skipped'] === $results['total']) {
            $this->comment('All routes are already up-to-date.');
        } else {
            $this->line("✅ Successfully generated {$results['success']} GeoJSON routes!");
        }
        
        return Command::SUCCESS;
    }
}
