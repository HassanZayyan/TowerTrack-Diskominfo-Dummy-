<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Owner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TowerOwnerUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all owners from the owners table
        $owners = Owner::all();
        
        $this->command->info('Found ' . $owners->count() . ' owners to create users for');
        
        $usersCreated = 0;
        $usersSkipped = 0;
        
        foreach ($owners as $owner) {
            // Create a unique email based on owner name
            $email = $this->generateUniqueEmail($owner->name);
            
            // Check if user already exists
            if (User::where('email', $email)->exists()) {
                $usersSkipped++;
                continue;
            }
            
            // Create user account for tower owner
            User::create([
                'name' => $owner->name,
                'email' => $email,
                'password' => Hash::make('password123'), // Default password
                'role' => 'tower_owner',
                'owner_id' => $owner->id, // Link to owner
                'email_verified_at' => now(), // Mark as verified
            ]);
            
            $usersCreated++;
        }
        
        $this->command->info("Created {$usersCreated} tower owner user accounts");
        $this->command->info("Skipped {$usersSkipped} existing users");
    }
    
    /**
     * Generate a unique email based on owner name
     */
    private function generateUniqueEmail(string $name): string
    {
        // Clean the name and convert to lowercase
        $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
        
        // Limit length to avoid email length issues
        $cleanName = substr($cleanName, 0, 20);
        
        $baseEmail = $cleanName . '@towerowner.local';
        $email = $baseEmail;
        $counter = 1;
        
        // Ensure email uniqueness
        while (User::where('email', $email)->exists()) {
            $email = $cleanName . $counter . '@towerowner.local';
            $counter++;
        }
        
        return $email;
    }
}
