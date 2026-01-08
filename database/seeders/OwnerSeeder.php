<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OwnerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates dummy tower owners for presentation purposes.
     */
    public function run(): void
    {
        $owners = [
            [
                'name' => 'PT Telekomunikasi Nusantara',
                'alamat' => 'Jl. Gatot Subroto No. 52, Jakarta Selatan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT Indosat Ooredoo',
                'alamat' => 'Jl. Medan Merdeka Barat No. 21, Jakarta Pusat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT XL Axiata',
                'alamat' => 'Jl. HR Rasuna Said Kav. X-5, Jakarta Selatan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT Smartfren Telecom',
                'alamat' => 'Jl. Kebon Jeruk No. 27, Jakarta Barat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT Dayamitra Telekomunikasi',
                'alamat' => 'Jl. Jenderal Sudirman Kav. 28-30, Jakarta Pusat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT Tower Bersama',
                'alamat' => 'Jl. Prof. Dr. Satrio Kav. 18, Jakarta Selatan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT Solusi Tunas Pratama',
                'alamat' => 'Jl. Letjen S. Parman Kav. 28, Jakarta Barat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PT Protelindo',
                'alamat' => 'Jl. TB Simatupang Kav. 7, Jakarta Selatan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert owners
        DB::table('owners')->insert($owners);
        
        $this->command->info('Inserted ' . count($owners) . ' dummy owners');
    }
}
