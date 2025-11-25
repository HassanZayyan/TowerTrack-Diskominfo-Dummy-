<?php

namespace App\Traits;

use App\Models\FoRoute;
use App\Services\FoRouteGenerationService;
use Illuminate\Support\Facades\Log;

/**
 * Trait untuk handle GeoJSON generation yang reusable
 * DRY: Menghilangkan duplikasi logika check dan generate GeoJSON
 */
trait HasGeoJsonGeneration
{
    /**
     * Check if GeoJSON needs to be generated or regenerated
     * DRY: Reusable method untuk check apakah GeoJSON perlu di-generate
     * 
     * @param FoRoute $route Route to check
     * @return bool True if GeoJSON needs generation
     */
    protected function needsGeoJsonGeneration(FoRoute $route): bool
    {
        // If no valid GeoJSON exists, needs generation
        if (!$route->hasValidGeoJSON()) {
            return true;
        }

        // If route was updated after GeoJSON was generated, needs regeneration
        return $route->needsGeoJSONRegeneration();
    }

    /**
     * Ensure GeoJSON exists and is up-to-date for a route
     * DRY: Reusable method untuk generate GeoJSON jika diperlukan
     * 
     * @param FoRoute $route Route to ensure GeoJSON for
     * @param string $context Context for logging (e.g., 'admin', 'public')
     * @return array ['needs_generation' => bool, 'generated' => bool, 'route' => FoRoute]
     */
    protected function ensureGeoJsonForRoute(FoRoute $route, string $context = 'admin'): array
    {
        $needsGeneration = $this->needsGeoJsonGeneration($route);
        $generated = false;

        if ($needsGeneration) {
            Log::info("🔄 {$context} - Generating GeoJSON on-demand (1 token will be consumed)", [
                'route_id' => $route->id,
                'route_name' => $route->name,
                'endpoint' => $context,
                'user_ip' => request()->ip(),
            ]);

            // Generate GeoJSON on-demand (consumes 1 OpenRouteService token)
            $routeService = app(FoRouteGenerationService::class);
            $generated = $routeService->generateRouteFromPoints($route);

            if (!$generated) {
                Log::warning("⚠️ {$context} - GeoJSON generation failed, using fallback polyline (0 tokens)", [
                    'route_id' => $route->id,
                ]);
            } else {
                // Refresh the route model to get newly generated GeoJSON
                $route = $route->fresh();
            }
        } else {
            Log::info("✅ {$context} - Loading existing GeoJSON from database (0 tokens)", [
                'route_id' => $route->id,
                'route_name' => $route->name,
                'endpoint' => $context,
                'user_ip' => request()->ip(),
            ]);
        }

        return [
            'needs_generation' => $needsGeneration,
            'generated' => $generated,
            'route' => $route,
        ];
    }
}


