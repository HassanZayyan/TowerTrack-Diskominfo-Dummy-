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
     * Build FO routes by grouping existing points by route_name.
     */
    public function run(): void
    {
        $this->disableForeignKeys();
        DB::table('fo_routes')->truncate();

        $points = FoPoint::query()
            ->whereNotNull('route_name')
            ->orderBy('route_name')
            ->orderBy('sequence_number')
            ->get()
            ->groupBy('route_name');

        $created = 0;
        foreach ($points as $routeName => $group) {
            if ($group->isEmpty()) {
                continue;
            }

            $area = $group->first()->area ?? 'ungaran';

            $pathCoordinates = $group->map(function ($p) {
                return [
                    'lat' => (float) $p->latitude,
                    'lng' => (float) $p->longitude,
                ];
            })->values()->toArray();

            $pointIds = $group->pluck('id')->values()->toArray();
            $totalPoints = count($pointIds);
            $totalDistance = $this->calculateDistance($pathCoordinates);

            FoRoute::create([
                'name' => $routeName,
                'slug' => Str::slug($routeName),
                'area' => $area,
                'description' => "Jalur FO {$routeName} - {$totalPoints} titik",
                'path_coordinates' => $pathCoordinates,
                'status' => 'active',
                'color' => $this->getRandomColor(),
                'total_distance' => $totalDistance,
                'total_points' => $totalPoints,
                'point_ids' => $pointIds,
                'properties' => [
                    'source' => 'fo_points',
                ],
            ]);

            $created++;
        }

        $this->enableForeignKeys();
        $this->command?->info("FO Routes created: {$created}");
    }

    private function calculateDistance(array $coordinates): float
    {
        if (count($coordinates) < 2) {
            return 0.0;
        }
        $total = 0.0;
        for ($i = 0; $i < count($coordinates) - 1; $i++) {
            $a = $coordinates[$i];
            $b = $coordinates[$i + 1];
            $total += $this->distanceBetweenPoints($a['lat'] ?? 0, $a['lng'] ?? 0, $b['lat'] ?? 0, $b['lng'] ?? 0);
        }
        return round($total, 2);
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


