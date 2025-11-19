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
     * 
     * Optimized version:
     * - Pre-fetches existing emails to avoid N+1 queries
     * - Uses batch insert for better performance
     * - Generates unique emails efficiently
     */
    public function run(): void
    {
        // Get all owners
        $owners = Owner::all();
        
        $this->command->info('Found ' . $owners->count() . ' owners to create users for');
        
        if ($owners->isEmpty()) {
            $this->command->warn('No owners found. Run OwnerSeeder first.');
            return;
        }
        
        // Pre-fetch existing emails to avoid N+1 queries
        // Get all existing tower owner emails
        $existingEmails = User::where('role', 'tower_owner')
            ->pluck('email')
            ->toArray();
        
        $this->command->info('Found ' . count($existingEmails) . ' existing tower owner users');
        
        $usersToCreate = [];
        $usersSkipped = 0;
        
        foreach ($owners as $owner) {
            // Generate unique email
            $email = $this->generateUniqueEmail($owner->name, $existingEmails);
            
            // Check if email already exists (shouldn't happen due to generateUniqueEmail, but double-check)
            if (in_array($email, $existingEmails)) {
                $usersSkipped++;
                continue;
            }
            
            // Add to existing emails cache to avoid duplicates in same batch
            $existingEmails[] = $email;
            
            $usersToCreate[] = [
                'name' => $owner->name,
                'email' => $email,
                'password' => Hash::make('password123'), // Default password
                'role' => 'tower_owner',
                'owner_id' => $owner->id, // Link to owner
                'email_verified_at' => now(), // Mark as verified
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Batch insert users in chunks for better performance
        if (!empty($usersToCreate)) {
            $chunks = array_chunk($usersToCreate, 100);
            $totalCreated = 0;
            
            foreach ($chunks as $chunk) {
                try {
                    User::insert($chunk);
                    $totalCreated += count($chunk);
                } catch (\Exception $e) {
                    $this->command->error("Failed to insert chunk: " . $e->getMessage());
                    // Continue with next chunk
                }
            }
            
            $this->command->info("Created {$totalCreated} tower owner user accounts");
        } else {
            $this->command->info("No new users to create");
        }
        
        if ($usersSkipped > 0) {
            $this->command->info("Skipped {$usersSkipped} owners (users already exist)");
        }
    }
    
    /**
     * Generate a unique email based on owner name.
     * Uses existing emails array reference to avoid duplicates.
     * 
     * @param string $name Owner name
     * @param array $existingEmails Reference to existing emails array (will be updated)
     * @return string Unique email address
     */
    private function generateUniqueEmail(string $name, array &$existingEmails): string
    {
        // Clean the name and convert to lowercase
        $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
        
        // Limit length to avoid email length issues
        $cleanName = substr($cleanName, 0, 20);
        
        $baseEmail = $cleanName . '@towerowner.local';
        $email = $baseEmail;
        $counter = 1;
        
        // Ensure email uniqueness by checking against existing emails
        while (in_array($email, $existingEmails)) {
            $email = $cleanName . $counter . '@towerowner.local';
            $counter++;
            
            // Safety check to avoid infinite loop
            if ($counter > 10000) {
                $email = $cleanName . '_' . time() . '@towerowner.local';
                break;
            }
        }
        
        return $email;
    }
}
