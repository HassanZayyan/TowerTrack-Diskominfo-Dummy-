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
        
        // Get recent reports with tower information
        $recentReports = Report::with(['tower', 'images'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'title' => 'Laporan #' . $report->id, // Generate title from ID since we don't have title field
                    'status' => $report->status,
                    'created_at' => $report->created_at->format('Y-m-d H:i'),
                    'tower_name' => $report->tower ? $report->tower->site_name : 'N/A',
                    'description' => substr($report->message, 0, 100) . '...', // Use message instead of description
                ];
            });

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
                'reportsGrowth' => round($reportsGrowth, 1)
            ],
            'recentReports' => $recentReports,
            'reportsByCategory' => $reportsByCategory,
            'towersByStatus' => $towersByStatus
        ]);
    }
}
