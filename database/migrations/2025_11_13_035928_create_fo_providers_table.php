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
     * Creates master_fo_providers table (master provider table)
     * Admin and operator can add new providers here
     */
    public function up(): void
    {
        // Check if fo_providers table already exists (old structure)
        if (Schema::hasTable('fo_providers')) {
            // Backup existing data if needed
            $this->migrateExistingData();
            
            // Drop old table structure
            Schema::dropIfExists('fo_providers');
        }
        
        // Create master provider table
        Schema::create('fo_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Nama provider (Diskominfo, MyRepublic, dll)
            $table->text('description')->nullable(); // Deskripsi provider
            $table->integer('default_sort_order')->default(0); // Urutan default untuk sorting
            $table->boolean('is_active')->default(true); // Status aktif (untuk enable/disable provider)
            $table->timestamps();
            
            // Indexes untuk performa
            $table->index('is_active');
            $table->index('default_sort_order');
            $table->index('name');
        });
        
        // Add foreign key constraint for fo_provider_id in users table
        // This runs after fo_providers table is created, so it's safe
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'fo_provider_id')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    // Check if foreign key doesn't exist yet to avoid duplicate constraint error
                    $foreignKeyExists = DB::select(
                        "SELECT CONSTRAINT_NAME 
                         FROM information_schema.KEY_COLUMN_USAGE 
                         WHERE TABLE_SCHEMA = DATABASE() 
                         AND TABLE_NAME = 'users' 
                         AND COLUMN_NAME = 'fo_provider_id' 
                         AND REFERENCED_TABLE_NAME = 'fo_providers'"
                    );
                    
                    if (empty($foreignKeyExists)) {
                        $table->foreign('fo_provider_id')
                              ->references('id')
                              ->on('fo_providers')
                              ->onDelete('set null');
                    }
                });
            } catch (\Exception $e) {
                // Ignore if foreign key already exists or other errors
                \Log::warning('Could not add fo_provider_id foreign key: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key constraint first if it exists
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'fo_provider_id')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['fo_provider_id']);
                });
            } catch (\Exception $e) {
                // Ignore if foreign key doesn't exist
                \Log::warning('Could not drop fo_provider_id foreign key: ' . $e->getMessage());
            }
        }
        
        Schema::dropIfExists('fo_providers');
    }

    /**
     * Migrate existing provider data to master table
     * Extract unique provider names from old fo_providers table
     */
    private function migrateExistingData(): void
    {
        try {
            // Get unique provider names from old table
            $existingProviders = DB::table('fo_providers')
                ->select('name')
                ->distinct()
                ->get();
            
            if ($existingProviders->isEmpty()) {
                return;
            }
            
            // Store provider names temporarily
            $providerNames = $existingProviders->pluck('name')->unique()->toArray();
            
            // Store in session/cache for next migration to use
            // We'll use this in the pivot table migration
            cache()->put('migrated_provider_names', $providerNames, 3600);
            
        } catch (\Exception $e) {
            // Ignore if table structure is different
            \Log::warning('Could not migrate existing provider data: ' . $e->getMessage());
        }
    }
};
