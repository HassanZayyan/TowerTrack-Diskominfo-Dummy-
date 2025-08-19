<?php

namespace Database\Seeders;

use App\Models\FoPoint;
use App\Models\FoRoute;
use Illuminate\Database\Seeder;

class FoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Sample FO Points untuk area Ungaran
        $ungaranPoints = [
            [
                'name' => 'Tiang FO Ungaran Pusat',
                'latitude' => -7.140236,
                'longitude' => 110.404889,
                'area' => 'ungaran',
                'description' => 'Titik pusat distribusi FO Ungaran',
                'type' => 'hub',
                'status' => 'active',
            ],
            [
                'name' => 'Junction Box Ungaran Timur',
                'latitude' => -7.138456,
                'longitude' => 110.408123,
                'area' => 'ungaran',
                'description' => 'Junction box untuk area Ungaran Timur',
                'type' => 'junction',
                'status' => 'active',
            ],
            [
                'name' => 'Pole FO Jalan Raya Ungaran',
                'latitude' => -7.142567,
                'longitude' => 110.401234,
                'area' => 'ungaran',
                'description' => 'Tiang FO di sepanjang Jalan Raya Ungaran',
                'type' => 'pole',
                'status' => 'active',
            ],
        ];

        // Sample FO Points untuk area Ambarawa
        $ambarawaPoints = [
            [
                'name' => 'Hub FO Ambarawa',
                'latitude' => -7.252916,
                'longitude' => 110.402000,
                'area' => 'ambarawa',
                'description' => 'Hub utama FO Ambarawa',
                'type' => 'hub',
                'status' => 'active',
            ],
            [
                'name' => 'Pole FO Stasiun Ambarawa',
                'latitude' => -7.250123,
                'longitude' => 110.400456,
                'area' => 'ambarawa',
                'description' => 'Tiang FO dekat Stasiun Ambarawa',
                'type' => 'pole',
                'status' => 'active',
            ],
        ];

        // Insert FO Points
        foreach ($ungaranPoints as $point) {
            FoPoint::create($point);
        }

        foreach ($ambarawaPoints as $point) {
            FoPoint::create($point);
        }

        // Sample FO Routes untuk Ungaran
        $ungaranRoutes = [
            [
                'name' => 'Jalur FO Ungaran Pusat - Timur',
                'area' => 'ungaran',
                'description' => 'Jalur utama dari pusat ke timur Ungaran',
                'path_coordinates' => [
                    ['lat' => -7.140236, 'lng' => 110.404889],
                    ['lat' => -7.139456, 'lng' => 110.406123],
                    ['lat' => -7.138456, 'lng' => 110.408123],
                ],
                'status' => 'active',
                'color' => '#3B82F6',
            ],
            [
                'name' => 'Jalur FO Jalan Raya Ungaran',
                'area' => 'ungaran',
                'description' => 'Jalur sepanjang Jalan Raya Ungaran',
                'path_coordinates' => [
                    ['lat' => -7.140236, 'lng' => 110.404889],
                    ['lat' => -7.141456, 'lng' => 110.403123],
                    ['lat' => -7.142567, 'lng' => 110.401234],
                ],
                'status' => 'active',
                'color' => '#10B981',
            ],
        ];

        // Sample FO Routes untuk Ambarawa
        $ambarawaRoutes = [
            [
                'name' => 'Jalur FO Ambarawa Utama',
                'area' => 'ambarawa',
                'description' => 'Jalur utama FO di Ambarawa',
                'path_coordinates' => [
                    ['lat' => -7.252916, 'lng' => 110.402000],
                    ['lat' => -7.251456, 'lng' => 110.401123],
                    ['lat' => -7.250123, 'lng' => 110.400456],
                ],
                'status' => 'active',
                'color' => '#F59E0B',
            ],
        ];

        // Insert FO Routes and calculate distances
        foreach ($ungaranRoutes as $route) {
            $foRoute = FoRoute::create([
                'name' => $route['name'],
                'area' => $route['area'],
                'description' => $route['description'],
                'path_coordinates' => json_encode($route['path_coordinates']),
                'status' => $route['status'],
                'color' => $route['color'],
            ]);
            // Manual calculation untuk seeding
            $foRoute->total_distance = $this->calculateRouteDistance($route['path_coordinates']);
            $foRoute->save();
        }

        foreach ($ambarawaRoutes as $route) {
            $foRoute = FoRoute::create([
                'name' => $route['name'],
                'area' => $route['area'],
                'description' => $route['description'],
                'path_coordinates' => json_encode($route['path_coordinates']),
                'status' => $route['status'],
                'color' => $route['color'],
            ]);
            // Manual calculation untuk seeding
            $foRoute->total_distance = $this->calculateRouteDistance($route['path_coordinates']);
            $foRoute->save();
        }

        $this->command->info('Sample FO data seeded successfully!');
        $this->command->info('Ungaran: ' . count($ungaranPoints) . ' points, ' . count($ungaranRoutes) . ' routes');
        $this->command->info('Ambarawa: ' . count($ambarawaPoints) . ' points, ' . count($ambarawaRoutes) . ' routes');
    }

    /**
     * Calculate distance untuk seeding
     */
    private function calculateRouteDistance($coordinates)
    {
        if (!$coordinates || count($coordinates) < 2) {
            return 0;
        }

        $totalDistance = 0;

        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $totalDistance += $this->distanceBetweenPoints(
                $coordinates[$i]['lat'],
                $coordinates[$i]['lng'],
                $coordinates[$i + 1]['lat'],
                $coordinates[$i + 1]['lng']
            );
        }

        return round($totalDistance, 2);
    }

    /**
     * Calculate distance antara dua titik menggunakan Haversine formula
     */
    private function distanceBetweenPoints($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Radius bumi dalam kilometer

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
