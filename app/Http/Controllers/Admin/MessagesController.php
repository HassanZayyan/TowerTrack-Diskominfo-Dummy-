<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Feedback;
use App\Models\Status;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessagesController extends Controller
{
    public function index(Request $request)
    {
        $reports = Report::with([
                'tower:id,site_name,alamat_menara',
                'images:id,report_id,file_path,file_type',
                'user:id,name,email',
                'responses.user:id,name',
                'responses.assets:id,report_response_id,file_path,file_type',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($report) {
                $statusMap = [
                    1 => 'pending',
                    2 => 'in_progress',
                    3 => 'closed',
                ];
                $report->setAttribute('status', $statusMap[$report->status_id] ?? 'pending');
                return $report;
            });

        $feedbacks = Feedback::with([
                'tower:id,site_name,alamat_menara',
                'assets:id,feedback_id,file_path,file_type',
                'user:id,name,email',
                'responses' => function ($query) {
                    $query->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
                },
            ])
            ->orderByDesc('created_at')
            ->get();

        try {
            $statuses = Status::all(['id', 'name', 'slug', 'color', 'icon']);
        } catch (\Exception $e) {
            $statuses = collect([
                ['id' => 1, 'name' => 'Pending', 'slug' => 'pending', 'color' => 'red', 'icon' => 'clock'],
                ['id' => 2, 'name' => 'In Progress', 'slug' => 'in_progress', 'color' => 'orange', 'icon' => 'refresh'],
                ['id' => 3, 'name' => 'Closed', 'slug' => 'closed', 'color' => 'green', 'icon' => 'check'],
            ]);
        }

        return Inertia::render('Admin/Messages/Index', [
            'reports' => $reports,
            'feedbacks' => $feedbacks,
            'statuses' => $statuses,
        ]);
    }
}


