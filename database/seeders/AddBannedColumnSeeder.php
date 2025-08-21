<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddBannedColumnSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if banned column exists, if not add it
        if (!Schema::hasColumn('users', 'banned')) {
            DB::statement('ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT FALSE');
            
            $this->command->info('Added banned column to users table');
        } else {
            $this->command->info('Banned column already exists in users table');
        }
    }
}