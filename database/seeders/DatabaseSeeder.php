<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@kominfo.go.id',
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);

        // Create operator user
        User::factory()->create([
            'name' => 'Operator User',
            'email' => 'operator@kominfo.go.id',
            'role' => 'operator',
            'password' => Hash::make('password123'),
        ]);

        // Create test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'operator',
            'password' => Hash::make('password123'),
        ]);

        // Seed tower data from CSV
        $this->call([
            OwnerSeeder::class,
            TowerSeeder::class,
            TowerOwnerSeeder::class,
        ]);
    }
}
