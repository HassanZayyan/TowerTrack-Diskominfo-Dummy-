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
        $reports = Report::with(['tower:id,site_name,alamat_menara', 'images:id,report_id,image_path,file_type', 'user:id,name,email'])
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
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'videos.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:51200',
        ]);

        ReportResponse::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        // Handle image uploads for admin response
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('admin-response-photos', 'public');
                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $path,
                    'file_type' => 'image/' . $image->getClientOriginalExtension(),
                ]);
            }
        }

        // Handle video uploads for admin response
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $video) {
                $path = $video->store('admin-response-videos', 'public');
                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $path,
                    'file_type' => 'video/' . $video->getClientOriginalExtension(),
                ]);
            }
        }

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


