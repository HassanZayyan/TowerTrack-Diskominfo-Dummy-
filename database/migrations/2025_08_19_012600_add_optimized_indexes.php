<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only run if tables exist
        if (!$this->allTablesExist()) {
            echo "Skipping index migration - required tables not found\n";
            return;
        }
        
        // Add indexes with proper error handling
        $this->addIndexesSafely();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!$this->allTablesExist()) {
            return;
        }
        
        $this->dropIndexesSafely();
    }
    
    /**
     * Check if all required tables exist
     */
    protected function allTablesExist(): bool
    {
        $requiredTables = ['towers', 'reports', 'feedbacks', 'tower_owners'];
        
        foreach ($requiredTables as $table) {
            if (!$this->tableExists($table)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if table exists
     */
    protected function tableExists(string $table): bool
    {
        try {
            $result = DB::select("SHOW TABLES LIKE ?", [$table]);
            return count($result) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Add indexes safely with error handling
     */
    protected function addIndexesSafely(): void
    {
        $indexes = [
            // Towers table indexes
            ['table' => 'towers', 'name' => 'towers_site_name_idx', 'columns' => ['site_name']],
            ['table' => 'towers', 'name' => 'towers_site_id_idx', 'columns' => ['site_id']],
            ['table' => 'towers', 'name' => 'towers_status_ijin_idx', 'columns' => ['status_ijin']],
            ['table' => 'towers', 'name' => 'towers_tower_type_idx', 'columns' => ['tower_type']],
            ['table' => 'towers', 'name' => 'towers_site_type_idx', 'columns' => ['site_type']],
            ['table' => 'towers', 'name' => 'towers_height_idx', 'columns' => ['tinggi_menara']],
            ['table' => 'towers', 'name' => 'towers_location_idx', 'columns' => ['latitude', 'longitude']],
            
            // Reports table indexes
            ['table' => 'reports', 'name' => 'reports_tower_id_idx', 'columns' => ['tower_id']],
            ['table' => 'reports', 'name' => 'reports_user_id_idx', 'columns' => ['user_id']],
            ['table' => 'reports', 'name' => 'reports_public_idx', 'columns' => ['is_public']],
            ['table' => 'reports', 'name' => 'reports_status_date_idx', 'columns' => ['status_id', 'created_at']],
            ['table' => 'reports', 'name' => 'reports_email_phone_idx', 'columns' => ['email', 'reporter_phone']],
            
            // Feedbacks table indexes
            ['table' => 'feedbacks', 'name' => 'feedbacks_tower_id_idx', 'columns' => ['tower_id']],
            ['table' => 'feedbacks', 'name' => 'feedbacks_user_id_idx', 'columns' => ['user_id']],
            ['table' => 'feedbacks', 'name' => 'feedbacks_public_idx', 'columns' => ['is_public']],
            ['table' => 'feedbacks', 'name' => 'feedbacks_status_date_idx', 'columns' => ['status', 'created_at']],
            ['table' => 'feedbacks', 'name' => 'feedbacks_email_phone_idx', 'columns' => ['email', 'sender_phone']],
            
            // Tower owners pivot table
            ['table' => 'tower_owners', 'name' => 'tower_owners_tower_owner_idx', 'columns' => ['tower_id', 'owner_id']],
        ];
        
        foreach ($indexes as $index) {
            $this->addIndexIfNotExists(
                $index['table'],
                $index['name'],
                $index['columns']
            );
        }
    }
    
    /**
     * Drop indexes safely
     */
    protected function dropIndexesSafely(): void
    {
        $indexes = [
            'towers' => [
                'towers_site_name_idx',
                'towers_site_id_idx',
                'towers_status_ijin_idx',
                'towers_tower_type_idx',
                'towers_site_type_idx',
                'towers_height_idx',
                'towers_location_idx',
            ],
            'reports' => [
                'reports_tower_id_idx',
                'reports_user_id_idx',
                'reports_public_idx',
                'reports_status_date_idx',
                'reports_email_phone_idx',
            ],
            'feedbacks' => [
                'feedbacks_tower_id_idx',
                'feedbacks_user_id_idx',
                'feedbacks_public_idx',
                'feedbacks_status_date_idx',
                'feedbacks_email_phone_idx',
            ],
            'tower_owners' => [
                'tower_owners_tower_owner_idx',
            ],
        ];
        
        foreach ($indexes as $table => $tableIndexes) {
            foreach ($tableIndexes as $indexName) {
                $this->dropIndexIfExists($table, $indexName);
            }
        }
    }
    
    /**
     * Add index if it doesn't exist
     */
    protected function addIndexIfNotExists(string $table, string $indexName, array $columns): void
    {
        if (!$this->indexExists($table, $indexName)) {
            try {
                Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                    if (count($columns) === 1) {
                        $table->index($columns[0], $indexName);
                    } else {
                        $table->index($columns, $indexName);
                    }
                });
                echo "✅ Added index {$indexName} to {$table}\n";
            } catch (\Exception $e) {
                echo "❌ Failed to add index {$indexName} to {$table}: {$e->getMessage()}\n";
            }
        } else {
            echo "⏭️  Index {$indexName} already exists on {$table}\n";
        }
    }
    
    /**
     * Drop index if it exists
     */
    protected function dropIndexIfExists(string $table, string $indexName): void
    {
        if ($this->indexExists($table, $indexName)) {
            try {
                Schema::table($table, function (Blueprint $table) use ($indexName) {
                    $table->dropIndex($indexName);
                });
                echo "🗑️  Dropped index {$indexName} from {$table}\n";
            } catch (\Exception $e) {
                echo "❌ Failed to drop index {$indexName} from {$table}: {$e->getMessage()}\n";
            }
        }
    }
    
    /**
     * Check if index exists
     */
    protected function indexExists(string $table, string $indexName): bool
    {
        try {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return count($result) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
};
