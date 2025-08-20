<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Get total counts
        $totalTowers = Tower::count();
        $totalReports = Report::count();
        $totalUsers = User::count();
        
        // Get counts by complaint status (reports)
        $pendingCount = Report::where('status_id', 1)->count();
        $inProgressCount = Report::where('status_id', 2)->count();
        $closedCount = Report::where('status_id', 3)->count();
        
        // Get counts by feedback status (string slugs)
        try {
            $feedbackPendingCount = \App\Models\Feedback::where('status', 'pending')->count();
            $feedbackInProgressCount = \App\Models\Feedback::where('status', 'in_progress')->count();
            $feedbackClosedCount = \App\Models\Feedback::where('status', 'closed')->count();
        } catch (\Throwable $e) {
            $feedbackPendingCount = 0;
            $feedbackInProgressCount = 0;
            $feedbackClosedCount = 0;
        }
        
        // Get recent reports with tower information
        $recentReports = Report::with(['tower'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'title' => 'Laporan #' . $report->id, // Generate title from ID since we don't have title field
                    // Use status slug for frontend compatibility
                    'status' => optional($report->status)->slug ?? 'pending',
                    'created_at' => $report->created_at->format('Y-m-d H:i'),
                    'tower_name' => $report->tower ? $report->tower->site_name : 'N/A',
                    'description' => substr($report->message, 0, 100) . '...', // Use message instead of description
                ];
            });

        // Recent feedbacks with tower information
        try {
            $recentFeedbacks = \App\Models\Feedback::with(['tower'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($fb) {
                    return [
                        'id' => $fb->id,
                        'title' => 'Masukan #' . $fb->id,
                        'status' => $fb->status ?? 'pending',
                        'created_at' => $fb->created_at->format('Y-m-d H:i'),
                        'tower_name' => $fb->tower ? $fb->tower->site_name : 'N/A',
                        'description' => substr($fb->message, 0, 100) . '...',
                    ];
                });
        } catch (\Throwable $e) {
            $recentFeedbacks = collect();
        }

        // Activity today metrics (basic implementation)
        $todayStart = Carbon::today();
        $newReportsToday = Report::where('created_at', '>=', $todayStart)->count();
        $respondedReportsToday = \App\Models\ReportResponse::where('created_at', '>=', $todayStart)->count();
        $updatedTowersToday = Tower::where('updated_at', '>=', $todayStart)->count();

        // Get reports by category for chart
        $reportsByCategory = Report::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'count' => $item->count
                ];
            });

        // Get towers by status ijin
        $towersByStatus = Tower::selectRaw('status_ijin, COUNT(*) as count')
            ->groupBy('status_ijin')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status_ijin ?: 'Tidak Ada Status',
                    'count' => $item->count
                ];
            });

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
                'totalTowers' => $totalTowers,
                'totalReports' => $totalReports,
                'totalUsers' => $totalUsers,
                'weeklyReports' => $weeklyReports,
                'reportsGrowth' => round($reportsGrowth, 1),
                'pendingCount' => $pendingCount,
                'inProgressCount' => $inProgressCount,
                'closedCount' => $closedCount,
                // Feedback status counts
                'feedbackPendingCount' => $feedbackPendingCount,
                'feedbackInProgressCount' => $feedbackInProgressCount,
                'feedbackClosedCount' => $feedbackClosedCount,
            ],
            'recentReports' => $recentReports,
            'recentFeedbacks' => $recentFeedbacks,
            'activityToday' => [
                'newReports' => $newReportsToday,
                'respondedReports' => $respondedReportsToday,
                'updatedTowers' => $updatedTowersToday,
            ],
            'reportsByCategory' => $reportsByCategory,
            'towersByStatus' => $towersByStatus
        ]);
    }
}
