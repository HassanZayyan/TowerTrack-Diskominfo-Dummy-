<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates pivot table to connect fo_points with fo_providers (master)
     * One point can have multiple providers, one provider can be on multiple points
     */
    public function up(): void
    {
        Schema::create('fo_point_provider', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fo_point_id')
                  ->constrained('fo_points')
                  ->onDelete('cascade');
            $table->foreignId('fo_provider_id')
                  ->constrained('fo_providers')
                  ->onDelete('cascade');
            $table->boolean('is_active')->default(true); // Status aktif per-point
            $table->integer('sort_order')->default(0); // Urutan tampil per-point (bisa override default)
            $table->timestamps();
            
            // Ensure unique combination of point and provider
            $table->unique(['fo_point_id', 'fo_provider_id'], 'fo_point_provider_unique');
            
            // Indexes untuk performa
            $table->index('fo_point_id');
            $table->index('fo_provider_id');
            $table->index('is_active');
            $table->index('sort_order');
        });
        
        // Migrate existing data if fo_providers table had data
        $this->migrateExistingProviderAssignments();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fo_point_provider');
    }

    /**
     * Migrate existing provider assignments from old structure
     * This handles the case where fo_providers had fo_point_id before
     */
    private function migrateExistingProviderAssignments(): void
    {
        try {
            // Check if we have cached provider names from previous migration
            $providerNames = cache()->get('migrated_provider_names', []);
            
            if (empty($providerNames)) {
                // Try to get from old table structure if it still exists temporarily
                // This is a fallback - normally the data would be migrated in the previous step
                return;
            }
            
            // Get master providers that were created
            $masterProviders = DB::table('fo_providers')
                ->whereIn('name', $providerNames)
                ->get()
                ->keyBy('name');
            
            // Note: We can't migrate old assignments directly because the old table
            // structure is already dropped. This migration assumes fresh start or
            // that data will be re-seeded using the seeder.
            
        } catch (\Exception $e) {
            \Log::warning('Could not migrate existing provider assignments: ' . $e->getMessage());
        }
    }
};

