<?php

namespace App\Console\Commands;

use App\Services\FoRouteGenerationService;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;

class ValidateFoConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fo:config-check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate FO route generation configuration and connectivity';

    /**
     * Execute the console command.
     */
    public function handle(FoRouteGenerationService $routeService)
    {
        $this->info('🔍 FO Route Generation Configuration Check');
        $this->newLine();

        // Check configuration
        $issues = $routeService->validateConfiguration();
        
        if (empty($issues)) {
            $this->line('✅ Configuration: All settings properly configured');
        } else {
            $this->warn('⚠️  Configuration Issues:');
            foreach ($issues as $issue) {
                $this->line("   - {$issue}");
            }
        }

        // Check if service is configured
        if ($routeService->isConfigured()) {
            $this->line('✅ Service: OpenRouteService properly configured');
            
            // Test API connectivity
            $this->line('🔄 Testing API connectivity...');
            if ($routeService->testApiConnectivity()) {
                $this->line('✅ Connectivity: OpenRouteService API accessible');
            } else {
                $this->warn('❌ Connectivity: Cannot reach OpenRouteService API');
            }
        } else {
            $this->warn('⚠️  Service: Using fallback route generation (API not configured)');
        }

        $this->newLine();
        
        // Configuration summary
        $this->info('📋 Configuration Summary:');
        $this->table(['Setting', 'Value', 'Status'], [
            ['API Key', $routeService->isConfigured() ? '✓ Configured' : '✗ Not Set', 
             $routeService->isConfigured() ? 'OK' : 'Missing'],
            ['Base URL', config('services.openrouteservice.base_url', 'Not Set'), 
             config('services.openrouteservice.base_url') ? 'OK' : 'Missing'],
            ['Fallback Available', 'Yes', 'OK'],
            ['Service Mode', $routeService->isConfigured() ? 'OpenRouteService' : 'Fallback', 
             $routeService->isConfigured() ? 'Optimal' : 'Basic'],
        ]);

        // Recommendations
        if (!$routeService->isConfigured()) {
            $this->newLine();
            $this->warn('💡 Recommendations:');
            $this->line('1. Get free API key from: https://openrouteservice.org/');
            $this->line('2. Add to .env: OPENROUTESERVICE_API_KEY=your_key_here');
            $this->line('3. Restart application after configuration');
            $this->line('4. Run: php artisan config:cache (if using config cache)');
        }

        return SymfonyCommand::SUCCESS;
    }
}
