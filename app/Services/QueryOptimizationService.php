<?php

namespace App\Services;

use App\Models\Tower;
use App\Models\Report;
use App\Models\Feedback;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Service for optimizing database queries
 */
class QueryOptimizationService
{
    /**
     * Get optimized tower list with proper eager loading
     */
    public static function getOptimizedTowerList(array $filters = [], int $perPage = 10)
    {
        $query = Tower::with(['owners:id,name,alamat'])
            ->select([
                'id', 'site_name', 'site_id', 'site_sap', 'alamat_menara',
                'latitude', 'longitude', 'tinggi_menara', 'tinggi_bangunan',
                'jumlah_pengguna', 'tower_type', 'site_type', 'status_ijin',
                'created_at', 'updated_at'
            ]);
        
        // Apply filters with optimized queries
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
    }
    
    /**
     * Get optimized tower statistics
     */
    public static function getOptimizedTowerStats()
    {
        return DB::table('towers')
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN status_ijin IS NOT NULL AND status_ijin != "" THEN 1 END) as with_permits,
                COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0 THEN 1 END) as with_coordinates,
                AVG(CASE WHEN tinggi_menara > 0 THEN tinggi_menara END) as average_height
            ')
            ->first();
    }
    
    /**
     * Get optimized report statistics
     */
    public static function getOptimizedReportStats()
    {
        return DB::table('reports')
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN status_id = 1 THEN 1 END) as pending,
                COUNT(CASE WHEN status_id = 2 THEN 1 END) as in_progress,
                COUNT(CASE WHEN status_id = 3 THEN 1 END) as closed,
                COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_count,
                COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_count
            ')
            ->first();
    }
    
    /**
     * Get optimized feedback statistics
     */
    public static function getOptimizedFeedbackStats()
    {
        return DB::table('feedbacks')
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN status = "pending" THEN 1 END) as pending,
                COUNT(CASE WHEN status = "in_progress" THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = "closed" THEN 1 END) as closed,
                COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_count,
                COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_count
            ')
            ->first();
    }
    
    /**
     * Get recent reports with optimized query
     */
    public static function getRecentReports(int $limit = 5)
    {
        return Report::with(['tower:id,site_name', 'user:id,name'])
            ->select(['id', 'tower_id', 'user_id', 'category', 'message', 'status_id', 'created_at'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Get recent feedbacks with optimized query
     */
    public static function getRecentFeedbacks(int $limit = 5)
    {
        return Feedback::with(['tower:id,site_name', 'user:id,name'])
            ->select(['id', 'tower_id', 'user_id', 'category', 'message', 'status', 'created_at'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }
    
    /**
     * Get towers for map with optimized query
     */
    public static function getTowersForMap(array $filters = [])
    {
        $query = Tower::select([
            'id', 'site_name', 'alamat_menara', 'latitude', 'longitude',
            'tinggi_menara', 'tinggi_bangunan', 'tower_type', 'site_type'
        ])
        ->whereNotNull('latitude')
        ->whereNotNull('longitude')
        ->where('latitude', '!=', 0)
        ->where('longitude', '!=', 0);
        
        // Apply owner filter if specified
        if (!empty($filters['owner']) && $filters['owner'] !== 'all') {
            $query->whereHas('owners', function($q) use ($filters) {
                $q->where('name', $filters['owner']);
            });
        }
        
        return $query->orderBy('site_name')->get();
    }
    
    /**
     * Get reports by category with optimized query
     */
    public static function getReportsByCategory()
    {
        return DB::table('reports')
            ->select('category', DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();
    }
    
    /**
     * Get towers by status with optimized query
     */
    public static function getTowersByStatus()
    {
        return DB::table('towers')
            ->select('status_ijin as status', DB::raw('COUNT(*) as count'))
            ->groupBy('status_ijin')
            ->orderByDesc('count')
            ->get();
    }
    
    /**
     * Get activity for today with optimized query
     */
    public static function getTodayActivity()
    {
        $today = now()->startOfDay();
        
        return [
            'new_reports' => Report::whereDate('created_at', $today)->count(),
            'responded_reports' => Report::whereDate('updated_at', $today)
                ->where('status_id', '!=', 1)
                ->count(),
            'updated_towers' => Tower::whereDate('updated_at', $today)->count(),
        ];
    }
}
