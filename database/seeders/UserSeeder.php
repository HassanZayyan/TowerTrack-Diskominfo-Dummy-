<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 1 admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@kominfo.go.id',
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);

        // Create 2 operator users
        User::factory()->create([
            'name' => 'Operator Satu',
            'email' => 'operator1@kominfo.go.id',
            'role' => 'operator',
            'password' => Hash::make('password123'),
        ]);

        User::factory()->create([
            'name' => 'Operator Dua',
            'email' => 'operator2@kominfo.go.id',
            'role' => 'operator',
            'password' => Hash::make('password123'),
        ]);

        // Create 3 complainant users
        User::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'role' => 'complainant',
            'password' => Hash::make('password123'),
        ]);

        User::factory()->create([
            'name' => 'Siti Rahayu',
            'email' => 'siti@example.com',
            'role' => 'complainant',
            'password' => Hash::make('password123'),
        ]);

        User::factory()->create([
            'name' => 'Ahmad Wijaya',
            'email' => 'ahmad@example.com',
            'role' => 'complainant',
            'password' => Hash::make('password123'),
        ]);
    }
}
