<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\FoProvider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProviderOwnerUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates provider owner users for each active provider
     */
    public function run(): void
    {
        $providers = FoProvider::where('is_active', true)->get();

        if ($providers->isEmpty()) {
            $this->command->warn('⚠ Tidak ada provider aktif ditemukan!');
            $this->command->warn('   Jalankan ProviderSeeder terlebih dahulu: php artisan db:seed --class=ProviderSeeder');
            return;
        }

        $this->command->info("✓ Menemukan {$providers->count()} provider aktif");

        $createdCount = 0;
        $skippedCount = 0;

        foreach ($providers as $provider) {
            // Generate email based on provider name (sanitized)
            $email = $this->generateProviderEmail($provider->name);
            
            // Check if user already exists
            $existingUser = User::where('email', $email)->first();
            
            if ($existingUser) {
                $this->command->warn("⚠ User sudah ada untuk provider '{$provider->name}': {$email}");
                $skippedCount++;
                continue;
            }

            // Create provider owner user
            $user = User::create([
                'name' => "Provider Owner - {$provider->name}",
                'email' => $email,
                'password' => Hash::make('password123'), // Default password
                'role' => 'provider_owner',
                'fo_provider_id' => $provider->id,
                'email_verified_at' => now(),
            ]);

            $this->command->info("✓ User dibuat untuk provider '{$provider->name}': {$email}");
            $createdCount++;
        }

        $this->command->newLine();
        $this->command->info("=== Summary ===");
        $this->command->info("✓ {$createdCount} user provider owner berhasil dibuat");
        if ($skippedCount > 0) {
            $this->command->warn("⚠ {$skippedCount} user sudah ada (dilewati)");
        }
        $this->command->info("📧 Default password untuk semua user: password123");
        $this->command->info("💡 Pastikan untuk mengubah password setelah login pertama kali!");
    }

    /**
     * Generate email address from provider name
     * Example: "PT Telkom Indonesia" -> "pttelkomindonesia@providerowner.local"
     */
    private function generateProviderEmail(string $providerName): string
    {
        // Remove common prefixes and clean the name
        $cleanName = strtolower($providerName);
        $cleanName = preg_replace('/^(pt|cv|ud|tok|toko)\s+/i', '', $cleanName);
        
        // Remove special characters and spaces
        $cleanName = preg_replace('/[^a-z0-9]/', '', $cleanName);
        
        // Limit length to avoid too long emails
        $cleanName = substr($cleanName, 0, 30);
        
        return $cleanName . '@providerowner.local';
    }
}

