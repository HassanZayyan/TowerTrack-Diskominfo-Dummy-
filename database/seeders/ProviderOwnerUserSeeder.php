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
     * 
     * Logic: Same as UserController::store() - auto-create provider if not exists
     * This seeder creates users for existing providers, or creates provider+user if provider doesn't exist
     */
    public function run(): void
    {
        $providers = FoProvider::where('is_active', true)->get();

        if ($providers->isEmpty()) {
            $this->command->warn('⚠ Tidak ada provider aktif ditemukan!');
            $this->command->warn('   Seeder akan membuat provider default jika diperlukan.');
            $this->command->newLine();
        } else {
            $this->command->info("✓ Menemukan {$providers->count()} provider aktif");
            $this->command->newLine();
        }

        $createdCount = 0;
        $skippedCount = 0;
        $providerCreatedCount = 0;

        // If no providers exist, create default providers first
        if ($providers->isEmpty()) {
            $this->command->info('📦 Membuat provider default...');
            $defaultProviders = [
                'Diskominfo',
                'MyRepublic',
                'Indihome',
                'IConnect',
            ];

            foreach ($defaultProviders as $index => $providerName) {
                $provider = FoProvider::where('name', $providerName)->first();
                
                if (!$provider) {
                    $provider = FoProvider::create([
                        'name' => $providerName,
                        'description' => null,
                        'default_sort_order' => FoProvider::getNextSortOrder(),
                        'is_active' => true,
                    ]);
                    $providerCreatedCount++;
                    $this->command->info("  ✓ Provider '{$providerName}' dibuat");
                }
            }
            
            // Refresh providers list
            $providers = FoProvider::where('is_active', true)->get();
            $this->command->newLine();
        }

        $this->command->info('👤 Membuat user provider owner...');
        $this->command->newLine();

        foreach ($providers as $provider) {
            // Generate email based on provider name (using unified method)
            // Use @providerowner.local domain for seeder consistency
            $email = FoProvider::generateOwnerEmail($provider->name, '@providerowner.local');
            
            // Check if user already exists for this provider
            $existingUser = User::where('fo_provider_id', $provider->id)
                ->where('role', 'provider_owner')
                ->first();
            
            if ($existingUser) {
                $this->command->warn("⚠ User sudah ada untuk provider '{$provider->name}': {$existingUser->email}");
                $skippedCount++;
                continue;
            }

            // Note: generateOwnerEmail() already handles uniqueness, so no need to check again

            // Create provider owner user (same logic as UserController::store())
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
        if ($providerCreatedCount > 0) {
            $this->command->info("✓ {$providerCreatedCount} provider default berhasil dibuat");
        }
        $this->command->info("✓ {$createdCount} user provider owner berhasil dibuat");
        if ($skippedCount > 0) {
            $this->command->warn("⚠ {$skippedCount} user sudah ada (dilewati)");
        }
        $this->command->newLine();
        $this->command->info("📧 Default password untuk semua user: password123");
        $this->command->info("💡 Pastikan untuk mengubah password setelah login pertama kali!");
        $this->command->newLine();
        $this->command->info("💡 Provider sekarang dikelola via User Management:");
        $this->command->info("   - Buat user baru dengan role 'provider_owner'");
        $this->command->info("   - Masukkan nama provider, sistem akan auto-create provider jika belum ada");
    }

}

