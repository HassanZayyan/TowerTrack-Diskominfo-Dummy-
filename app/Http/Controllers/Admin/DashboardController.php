<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use App\Models\Report;
use App\Models\User;
use App\Services\QueryOptimizationService;
use App\Services\EnhancedCacheService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Use optimized queries with caching
        $towerStats = EnhancedCacheService::rememberTowerStats();
        $reportStats = EnhancedCacheService::rememberReportStats();
        $feedbackStats = EnhancedCacheService::rememberFeedbackStats();
        
        $totalUsers = User::count();
        
        // Get recent reports and feedbacks with optimized queries
        $recentReports = EnhancedCacheService::rememberRecentReports(5);
        $recentFeedbacks = EnhancedCacheService::rememberRecentFeedbacks(5);

        // Get activity and chart data with optimized queries
        $activityToday = QueryOptimizationService::getTodayActivity();
        $reportsByCategory = QueryOptimizationService::getReportsByCategory();
        $towersByStatus = QueryOptimizationService::getTowersByStatus();

        // Get weekly growth stats
        $weeklyReports = Report::where('created_at', '>=', Carbon::now()->subWeek())
            ->count();
        
        $previousWeekReports = Report::whereBetween('created_at', [
            Carbon::now()->subWeeks(2),
            Carbon::now()->subWeek()
        ])->count();

        $reportsGrowth = $previousWeekReports > 0 
            ? (($weeklyReports - $previousWeekReports) / $previousWeekReports) * 100 
            : 0;

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalTowers' => $towerStats['total'],
                'totalReports' => $reportStats['total'],
                'totalUsers' => $totalUsers,
                'weeklyReports' => $weeklyReports,
                'reportsGrowth' => round($reportsGrowth, 1),
                'pendingCount' => $reportStats['pending'],
                'inProgressCount' => $reportStats['in_progress'],
                'closedCount' => $reportStats['closed'],
                // Feedback status counts
                'feedbackPendingCount' => $feedbackStats['pending'],
                'feedbackInProgressCount' => $feedbackStats['in_progress'],
                'feedbackClosedCount' => $feedbackStats['closed'],
            ],
            'recentReports' => $recentReports,
            'recentFeedbacks' => $recentFeedbacks,
            'activityToday' => $activityToday,
            'reportsByCategory' => $reportsByCategory,
            'towersByStatus' => $towersByStatus
        ]);
    }
}
