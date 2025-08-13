<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        $reports = Report::with(['tower:id,site_name', 'images:id,report_id,image_path', 'user:id,name,email'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/Complaints', [
            'reports' => $reports,
        ]);
    }

    public function respond(Request $request, Report $report)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        ReportResponse::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        // Optionally update status to responded
        $report->update(['status' => 'responded']);

        return back();
    }

    public function updateStatus(Request $request, Report $report)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,in_progress,responded,closed',
        ]);
        $report->update(['status' => $validated['status']]);
        return back();
    }
}


