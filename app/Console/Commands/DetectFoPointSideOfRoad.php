<?php

namespace App\Console\Commands;

use App\Models\FoPoint;
use App\Services\FoPointSideDetectionService;
use Illuminate\Console\Command;

class DetectFoPointSideOfRoad extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fo:detect-side-of-road 
                            {--route= : Specific route name to process}
                            {--area= : Specific area to process}
                            {--force : Force update even if already set}
                            {--limit= : Limit number of points to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Detect and update side of road for FO points based on route polyline';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Starting FO Point Side Detection...');
        
        $service = app(FoPointSideDetectionService::class);
        
        // Build query
        $query = FoPoint::query();
        
        if ($this->option('route')) {
            $query->where('route_name', $this->option('route'));
            $this->info("📍 Filtering by route: {$this->option('route')}");
        }
        
        if ($this->option('area')) {
            $query->where('area', $this->option('area'));
            $this->info("📍 Filtering by area: {$this->option('area')}");
        }
        
        // Skip points that already have side set (unless force)
        if (!$this->option('force')) {
            $query->where(function($q) {
                $q->whereNull('side_of_road')
                  ->orWhere('side_of_road', 'unknown');
            });
        }
        
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        if ($limit) {
            $query->limit($limit);
        }
        
        $points = $query->get();
        $total = $points->count();
        
        if ($total === 0) {
            $this->warn('⚠️  No points found to process.');
            return 0;
        }
        
        $this->info("📊 Found {$total} points to process");
        
        $bar = $this->output->createProgressBar($total);
        $bar->start();
        
        $stats = [
            'left' => 0,
            'right' => 0,
            'unknown' => 0,
            'failed' => 0
        ];
        
        foreach ($points as $point) {
            try {
                $side = $service->detectSideFromRoute($point);
                
                $point->side_of_road = $side;
                $point->save();
                
                $stats[$side]++;
            } catch (\Exception $e) {
                $stats['failed']++;
                $this->newLine();
                $this->error("❌ Failed for point {$point->id}: " . $e->getMessage());
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        // Display results
        $this->info('✅ Detection completed!');
        $this->table(
            ['Side', 'Count'],
            [
                ['Left', $stats['left']],
                ['Right', $stats['right']],
                ['Unknown', $stats['unknown']],
                ['Failed', $stats['failed']],
            ]
        );
        
        $this->info("📈 Total processed: {$total}");
        
        return 0;
    }
}

