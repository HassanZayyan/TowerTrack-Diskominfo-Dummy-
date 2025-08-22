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

        // Create operator users
        User::factory()->create([
            'name' => 'Operator',
            'email' => 'operator@kominfo.go.id',
            'role' => 'operator',
            'password' => Hash::make('password123'),
        ]);

        // Create complainant users
        User::factory()->create([
            'name' => 'Compainant',
            'email' => 'complainant@example.com',
            'role' => 'complainant',
            'password' => Hash::make('password123'),
        ]);

        // Create tower owner user
        User::factory()->create([
            'name' => 'Tower Owner',
            'email' => 'tower_owner@example.com',
            'role' => 'tower_owner',
            'password' => Hash::make('password123'),
        ]);
    }
}
