<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddDatabaseIndexes extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:add-indexes {--force : Force add indexes even if they exist}';

    /**
     * The console command description.
     */
    protected $description = 'Add optimized database indexes for better performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting database index optimization...');
        
        if (!$this->allTablesExist()) {
            $this->error('❌ Required tables not found. Please run migrations first.');
            return 1;
        }
        
        $this->info('✅ All required tables found');
        
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
        
        $added = 0;
        $skipped = 0;
        $failed = 0;
        
        foreach ($indexes as $index) {
            $result = $this->addIndexIfNotExists(
                $index['table'],
                $index['name'],
                $index['columns']
            );
            
            switch ($result) {
                case 'added':
                    $added++;
                    break;
                case 'skipped':
                    $skipped++;
                    break;
                case 'failed':
                    $failed++;
                    break;
            }
        }
        
        $this->info("\n📊 Index Summary:");
        $this->info("✅ Added: {$added}");
        $this->info("⏭️  Skipped: {$skipped}");
        $this->info("❌ Failed: {$failed}");
        
        if ($failed === 0) {
            $this->info("\n🎉 Database indexes optimized successfully!");
            return 0;
        } else {
            $this->error("\n⚠️  Some indexes failed to be added. Check the logs above.");
            return 1;
        }
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
            $exists = count($result) > 0;
            $this->line("Table {$table}: " . ($exists ? 'EXISTS' : 'NOT FOUND'));
            return $exists;
        } catch (\Exception $e) {
            $this->error("Error checking table {$table}: {$e->getMessage()}");
            return false;
        }
    }
    
    /**
     * Add index if it doesn't exist
     */
    protected function addIndexIfNotExists(string $table, string $indexName, array $columns): string
    {
        if (!$this->indexExists($table, $indexName) || $this->option('force')) {
            try {
                Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                    if (count($columns) === 1) {
                        $table->index($columns[0], $indexName);
                    } else {
                        $table->index($columns, $indexName);
                    }
                });
                
                $columnStr = implode(', ', $columns);
                $this->info("✅ Added index {$indexName} to {$table} ({$columnStr})");
                return 'added';
            } catch (\Exception $e) {
                $this->error("❌ Failed to add index {$indexName} to {$table}: {$e->getMessage()}");
                return 'failed';
            }
        } else {
            $this->line("⏭️  Index {$indexName} already exists on {$table}");
            return 'skipped';
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
}
