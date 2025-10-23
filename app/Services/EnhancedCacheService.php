<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use App\Models\Tower;
use App\Models\Report;
use App\Models\Feedback;

/**
 * Enhanced caching service with tag support and intelligent invalidation
 */
class EnhancedCacheService
{
    /**
     * Cache a value with tags for better invalidation control
     */
    public static function rememberWithTags(string $key, array $tags, callable $callback, int $ttl = 3600)
    {
        return Cache::tags($tags)->remember($key, $ttl, $callback);
    }
    
    /**
     * Invalidate cache by tags
     */
    public static function invalidateByTags(array $tags)
    {
        Cache::tags($tags)->flush();
    }
    
    /**
     * Cache tower list with intelligent key generation
     */
    public static function rememberTowerList(array $filters = [], int $perPage = 10)
    {
        $key = 'towers:list:' . md5(json_encode($filters) . $perPage);
        $tags = ['towers', 'list'];
        
        return self::rememberWithTags($key, $tags, function () use ($filters, $perPage) {
            $query = Tower::with('owners');
            
            // Apply filters
            if (!empty($filters['search'])) {
                $query->where(function($q) use ($filters) {
                    $q->where('site_name', 'like', "%{$filters['search']}%")
                      ->orWhere('site_id', 'like', "%{$filters['search']}%")
                      ->orWhere('alamat_menara', 'like', "%{$filters['search']}%");
                });
            }
            
            if (!empty($filters['owner']) && $filters['owner'] !== 'all') {
                $query->whereHas('owners', function($q) use ($filters) {
                    $q->where('name', $filters['owner']);
                });
            }
            
            if (!empty($filters['tower_type']) && $filters['tower_type'] !== 'all') {
                $query->where('tower_type', $filters['tower_type']);
            }
            
            if (!empty($filters['coord']) && $filters['coord'] === 'with') {
                $query->whereNotNull('latitude')
                      ->whereNotNull('longitude')
                      ->where('latitude', '!=', 0)
                      ->where('longitude', '!=', 0);
            }
            
            return $query->orderBy('site_name')->paginate($perPage);
        });
    }
    
    /**
     * Cache tower statistics
     */
    public static function rememberTowerStats()
    {
        $key = 'towers:stats';
        $tags = ['towers', 'stats'];
        
        return self::rememberWithTags($key, $tags, function () {
            return [
                'total' => Tower::count(),
                'with_permits' => Tower::whereNotNull('status_ijin')->where('status_ijin', '!=', '')->count(),
                'with_coordinates' => Tower::whereNotNull('latitude')->whereNotNull('longitude')->count(),
                'average_height' => Tower::where('tinggi_menara', '>', 0)->avg('tinggi_menara'),
            ];
        }, 1800); // 30 minutes cache
    }
    
    /**
     * Cache report statistics
     */
    public static function rememberReportStats()
    {
        $key = 'reports:stats';
        $tags = ['reports', 'stats'];
        
        return self::rememberWithTags($key, $tags, function () {
            return [
                'total' => Report::count(),
                'pending' => Report::where('status_id', 1)->count(),
                'in_progress' => Report::where('status_id', 2)->count(),
                'closed' => Report::where('status_id', 3)->count(),
                'public' => Report::where('is_public', true)->count(),
                'private' => Report::where('is_public', false)->count(),
            ];
        }, 1800); // 30 minutes cache
    }
    
    /**
     * Cache feedback statistics
     */
    public static function rememberFeedbackStats()
    {
        $key = 'feedbacks:stats';
        $tags = ['feedbacks', 'stats'];
        
        return self::rememberWithTags($key, $tags, function () {
            return [
                'total' => Feedback::count(),
                'pending' => Feedback::where('status_id', 1)->count(),
                'in_progress' => Feedback::where('status_id', 2)->count(),
                'closed' => Feedback::where('status_id', 3)->count(),
                'public' => Feedback::where('is_public', true)->count(),
                'private' => Feedback::where('is_public', false)->count(),
            ];
        }, 1800); // 30 minutes cache
    }
    
    /**
     * Cache recent reports
     */
    public static function rememberRecentReports(int $limit = 5)
    {
        $key = "reports:recent:{$limit}";
        $tags = ['reports', 'recent'];
        
        return self::rememberWithTags($key, $tags, function () use ($limit) {
            return Report::with(['tower:id,site_name', 'user:id,name'])
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get();
        }, 900); // 15 minutes cache
    }
    
    /**
     * Cache recent feedbacks
     */
    public static function rememberRecentFeedbacks(int $limit = 5)
    {
        $key = "feedbacks:recent:{$limit}";
        $tags = ['feedbacks', 'recent'];
        
        return self::rememberWithTags($key, $tags, function () use ($limit) {
            return Feedback::with(['tower:id,site_name', 'user:id,name'])
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get();
        }, 900); // 15 minutes cache
    }
    
    /**
     * Invalidate all tower-related caches
     */
    public static function invalidateTowerCaches()
    {
        self::invalidateByTags(['towers', 'list', 'stats']);
    }
    
    /**
     * Invalidate all report-related caches
     */
    public static function invalidateReportCaches()
    {
        self::invalidateByTags(['reports', 'stats', 'recent']);
    }
    
    /**
     * Invalidate all feedback-related caches
     */
    public static function invalidateFeedbackCaches()
    {
        self::invalidateByTags(['feedbacks', 'stats', 'recent']);
    }
    
    /**
     * Generate cache key for specific tower
     */
    public static function towerKey(int $id): string
    {
        return "tower:{$id}";
    }
    
    /**
     * Get cached value by key
     */
    public static function get(string $key)
    {
        return Cache::get($key);
    }
    
    /**
     * Put value in cache
     */
    public static function put(string $key, $value, int $ttl = 3600): void
    {
        Cache::put($key, $value, $ttl);
    }
    
    /**
     * Cache single tower with relationships
     */
    public static function rememberTower(int $id)
    {
        $key = self::towerKey($id);
        $tags = ['towers', 'single'];
        
        return self::rememberWithTags($key, $tags, function () use ($id) {
            return Tower::with(['owners'])
                ->select([
                    'id', 'site_name', 'site_id', 'site_sap', 'alamat_menara',
                    'latitude', 'longitude', 'tinggi_menara', 'tinggi_bangunan',
                    'jumlah_pengguna', 'tower_type', 'site_type', 'status_ijin',
                    'created_at', 'updated_at'
                ])
                ->findOrFail($id);
        });
    }
    
    /**
     * Invalidate single tower cache
     */
    public static function invalidateTower(int $id): void
    {
        $key = self::towerKey($id);
        Cache::forget($key);
        self::invalidateByTags(['towers', 'single']);
    }
    
    /**
     * Warm up critical caches
     */
    public static function warmUpCaches()
    {
        // Warm up statistics
        self::rememberTowerStats();
        self::rememberReportStats();
        self::rememberFeedbackStats();
        
        // Warm up recent data
        self::rememberRecentReports();
        self::rememberRecentFeedbacks();
        
        // Warm up common tower list queries
        self::rememberTowerList(['coord' => 'with'], 10);
        self::rememberTowerList([], 10);
    }
}
