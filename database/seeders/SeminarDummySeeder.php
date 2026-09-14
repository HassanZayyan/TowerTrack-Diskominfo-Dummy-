<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SeminarDummySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding Seminar Dummy data...');

        // --- 1. Seed Dummy Tower ---
        $this->seedTower();

        // --- 2. Seed Dummy FO Points ---
        $this->seedFoPoints();
    }

    private function seedTower(): void
    {
        $towerData = [
            'site_id' => 'SEMINAR001',
            'site_sap' => 'SAP-SEMINAR-01',
            'site_name' => 'tower seminar dummy',
            'longitude' => 110.43586159717067,
            'latitude' => -7.0545096581775075,
            'tinggi_menara' => 50,
            'tinggi_bangunan' => 10,
            'jumlah_pengguna' => 100, // Reasonable dummy value
            'jumlah_kaki' => 4,
            'alamat_menara' => 'Lokasi Seminar Dummy, Semarang',
            'tower_type' => 'Monopole',
            'site_type' => 'Macro',
            'no_ijin' => 'IJIN/SEMINAR/001',
            'tanggal_ijin' => Carbon::now()->subMonths(1)->format('Y-m-d'),
            'berlaku_hingga' => Carbon::now()->addYears(5)->format('Y-m-d'),
            'jenis_ijin' => 'Izin Permanen',
            'status_ijin' => 'Aktif',
            'prs' => 'PRS-SEM',
            'prs_id' => 'PRSID-SEM',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Ensure unique
        $exists = DB::table('towers')->where('site_id', $towerData['site_id'])->exists();

        if (!$exists) {
            DB::table('towers')->insert($towerData);
            $this->command->info(' - Tower "tower seminar dummy" created.');
        } else {
            $this->command->info(' - Tower "tower seminar dummy" already exists.');
        }
    }

    private function seedFoPoints(): void
    {
        $points = [
            [
                'sequence_number' => 9901,
                'name' => 'FO 1',
                'latitude' => -7.054448434494761,
                'longitude' => 110.43558582923748,
                'type' => 'pole',
                'route_name' => 'Jalur Seminar Dummy',
                'description' => 'Dummy Type Pole'
            ],
            [
                'sequence_number' => 9902,
                'name' => 'FO 2',
                'latitude' => -7.054578545372753,
                'longitude' => 110.43596832958688,
                'type' => 'junction', // User specified "junction box", mapping to "junction"
                'route_name' => 'Jalur Seminar Dummy',
                'description' => 'Dummy Type Junction Box'
            ],
            [
                'sequence_number' => 9903,
                'name' => 'FO 3',
                'latitude' => -7.054653727346033,
                'longitude' => 110.43621393652745,
                'type' => 'endpoint',
                'route_name' => 'Jalur Seminar Dummy',
                'description' => 'Dummy Type Endpoint'
            ],
        ];

        foreach ($points as $point) {
            $data = [
                'sequence_number' => $point['sequence_number'],
                'name' => $point['name'],
                'latitude' => $point['latitude'],
                'longitude' => $point['longitude'],
                'original_coordinates' => $point['latitude'] . ', ' . $point['longitude'],
                'route_name' => $point['route_name'],
                'area' => 'ungaran', // Using default
                'description' => $point['description'],
                'type' => $point['type'],
                'side_of_road' => 'unknown',
                'status' => 'active',
                'properties' => json_encode(['source' => 'seminar_dummy_seeder']),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Check existence
            $exists = DB::table('fo_points')
                ->where('name', $point['name'])
                ->where('route_name', $point['route_name'])
                ->exists();

            if (!$exists) {
                DB::table('fo_points')->insert($data);
                $this->command->info(" - FO Point \"{$point['name']}\" created.");
            } else {
                $this->command->info(" - FO Point \"{$point['name']}\" already exists.");
            }
        }
    }
}
