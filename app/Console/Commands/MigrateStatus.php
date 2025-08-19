<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-status {--fresh : Whether to refresh the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate database with new status system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting migration process...');
        
        if ($this->option('fresh')) {
            $this->info('Refreshing database...');
            Artisan::call('migrate:fresh', [], $this->getOutput());
        } else {
            $this->info('Running migrations...');
            Artisan::call('migrate', [], $this->getOutput());
        }
        
        $this->info('Seeding statuses...');
        Artisan::call('db:seed', ['--class' => 'StatusSeeder'], $this->getOutput());
        
        $this->info('Migration complete!');
        
        return Command::SUCCESS;
    }
}
