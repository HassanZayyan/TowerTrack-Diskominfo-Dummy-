<?php

namespace Database\Seeders;

use App\Models\FoPoint;
use App\Models\FoRoute;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FoRoutesFromPointsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->disableForeignKeys();
        DB::table('fo_routes')->truncate();

        // Group FO points by route_name
        $pointsByRoute = FoPoint::select('route_name', 'id', 'sequence_number', 'latitude', 'longitude', 'name')
            ->orderBy('route_name')
            ->orderBy('sequence_number')
            ->get()
            ->groupBy('route_name');

        $totalRoutes = 0;
        $totalPoints = 0;

        // Define the expected route order based on the line mapping
        $expectedRoutes = [
            'Assalamah masuk Asmara',
            'Terminal - Assalamah',
            'Terminal - DPU',
            'Dinkes - Diskominfo',
            'Wujil - RSUD',
            'Assalamah - Taman Unyil',
            'Dishub - Bergas',
            'Pasar Karangjati - Kelurahan Karangjati',
            'Setelah Terowongan TOL - Pertigaan Kajangan',
            'Polsek Bergas - Ngempon',
            'Polsek Bergas - Wujil',
            'Terowongan - Bangjo Asmara',
            'Kelurahan Genuk',
            'SMADA',
            'Alun-Alun Lama - Ungaran Barat',
            'RSUD - Terminal',
            'Kalongan - Jembatan Longsor',
        ];

        // Process routes in the expected order
        foreach ($expectedRoutes as $routeName) {
            $points = $pointsByRoute->get($routeName);
            
            if (!$points || $points->isEmpty()) {
                $this->command?->warn("No points found for route: {$routeName}");
                continue;
            }

            // Calculate total distance for the route
            $totalDistance = 0;
            $coordinates = [];
            $pointIds = [];

            $sortedPoints = $points->sortBy('sequence_number');
            $previousPoint = null;

            foreach ($sortedPoints as $point) {
                $coordinates[] = [$point->longitude, $point->latitude];
                $pointIds[] = $point->id;

                if ($previousPoint) {
                    $distance = $this->calculateDistance(
                        $previousPoint->latitude,
                        $previousPoint->longitude,
                        $point->latitude,
                        $point->longitude
                    );
                    $totalDistance += $distance;
                }

                $previousPoint = $point;
            }

            // Generate route description based on start and end points
            $startPointName = $sortedPoints->first()->name ?? 'Start Point';
            $endPointName = $sortedPoints->last()->name ?? 'End Point';
            $description = "Jalur FO dari {$startPointName} ke {$endPointName}";

            // Mark last point as endpoint
            $lastPoint = $sortedPoints->last();
            if ($lastPoint) {
                FoPoint::where('id', $lastPoint->id)->update(['type' => 'endpoint']);
            }

            // Create the route
            FoRoute::create([
                'name' => $routeName,
                'description' => $description,
                'total_distance' => round($totalDistance / 1000, 2), // Convert to kilometers
                'total_points' => $points->count(),
                'status' => 'active',
                'area' => 'ungaran',
                'path_coordinates' => $coordinates,
                'point_ids' => $pointIds,
                'color' => $this->getRouteColor($routeName),
                'properties' => [
                    'generated_from' => 'fo_points',
                    'generation_date' => now()->toISOString(),
                    'point_count' => $points->count(),
                    'distance_unit' => 'meters',
                    'route_type' => 'fiber_optic',
                    'start_point_name' => $startPointName,
                    'end_point_name' => $endPointName,
                    'start_point_id' => $sortedPoints->first()->id,
                    'end_point_id' => $sortedPoints->last()->id,
                ],
            ]);

            $totalRoutes++;
            $totalPoints += $points->count();

            $this->command?->line("Created route: {$routeName} ({$points->count()} points, " . round($totalDistance, 2) . "m)");
        }

        // Handle any unexpected routes that weren't in our expected list
        foreach ($pointsByRoute as $routeName => $points) {
            if (!in_array($routeName, $expectedRoutes) && !$points->isEmpty()) {
                $this->command?->warn("Found unexpected route: {$routeName} with {$points->count()} points");
                
                // Process unexpected route with same logic
                $totalDistance = 0;
                $coordinates = [];
                $pointIds = [];

                $sortedPoints = $points->sortBy('sequence_number');
                $previousPoint = null;

                foreach ($sortedPoints as $point) {
                    $coordinates[] = [$point->longitude, $point->latitude];
                    $pointIds[] = $point->id;

                    if ($previousPoint) {
                        $distance = $this->calculateDistance(
                            $previousPoint->latitude,
                            $previousPoint->longitude,
                            $point->latitude,
                            $point->longitude
                        );
                        $totalDistance += $distance;
                    }

                    $previousPoint = $point;
                }

                $startPointName = $sortedPoints->first()->name ?? 'Start Point';
                $endPointName = $sortedPoints->last()->name ?? 'End Point';
                $description = "Jalur FO dari {$startPointName} ke {$endPointName}";

                // Mark last point as endpoint for unexpected route
                $lastPoint = $sortedPoints->last();
                if ($lastPoint) {
                    FoPoint::where('id', $lastPoint->id)->update(['type' => 'endpoint']);
                }

                FoRoute::create([
                    'name' => $routeName,
                    'description' => $description,
                    'total_distance' => round($totalDistance / 1000, 2), // Convert to kilometers
                    'total_points' => $points->count(),
                    'status' => 'active',
                    'area' => 'ungaran',
                    'path_coordinates' => $coordinates,
                    'point_ids' => $pointIds,
                    'color' => '#FF6B6B', // Red color for unexpected routes
                    'properties' => [
                        'generated_from' => 'fo_points',
                        'generation_date' => now()->toISOString(),
                        'point_count' => $points->count(),
                        'distance_unit' => 'meters',
                        'route_type' => 'fiber_optic',
                        'start_point_name' => $startPointName,
                        'end_point_name' => $endPointName,
                        'start_point_id' => $sortedPoints->first()->id,
                        'end_point_id' => $sortedPoints->last()->id,
                        'unexpected_route' => true,
                    ],
                ]);

                $totalRoutes++;
                $totalPoints += $points->count();
            }
        }

        $this->enableForeignKeys();

        $this->command?->info("FO Routes created: {$totalRoutes} routes with {$totalPoints} total points");
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /**
     * Get a color for the route based on its name.
     */
    private function getRouteColor(string $routeName): string
    {
        $colors = [
            'Assalamah masuk Asmara' => '#3B82F6',
            'Terminal - Assalamah' => '#10B981',
            'Terminal - DPU' => '#F59E0B',
            'Dinkes - Diskominfo' => '#EF4444',
            'Wujil - RSUD' => '#8B5CF6',
            'Assalamah - Taman Unyil' => '#06B6D4',
            'Dishub - Bergas' => '#84CC16',
            'Pasar Karangjati - Kelurahan Karangjati' => '#F97316',
            'Setelah Terowongan TOL - Pertigaan Kajangan' => '#EC4899',
            'Polsek Bergas - Ngempon' => '#14B8A6',
            'Polsek Bergas - Wujil' => '#F472B6',
            'Terowongan - Bangjo Asmara' => '#A855F7',
            'Kelurahan Genuk' => '#22D3EE',
            'SMADA' => '#65A30D',
            'Alun-Alun Lama - Ungaran Barat' => '#DC2626',
            'RSUD - Terminal' => '#7C3AED',
            'Kalongan - Jembatan Longsor' => '#059669',
        ];

        return $colors[$routeName] ?? '#6B7280'; // Default gray color
    }

    private function distanceBetweenPoints($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371; // kilometers
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    private function getRandomColor(): string
    {
        $colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        return $colors[array_rand($colors)];
    }

    private function disableForeignKeys(): void
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } catch (\Throwable $e) {
            // ignore for non-MySQL drivers
        }
    }

    private function enableForeignKeys(): void
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (\Throwable $e) {
            // ignore for non-MySQL drivers
        }
    }
}


