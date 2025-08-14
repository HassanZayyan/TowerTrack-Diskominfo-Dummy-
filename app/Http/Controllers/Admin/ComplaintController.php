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
        $reports = Report::with([
                'tower:id,site_name,alamat_menara', 
                'images:id,report_id,image_path,file_type', 
                'user:id,name,email',
                'responses:id,report_id,user_id,message,image_path,file_type,status,created_at'
            ])
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
            'status' => 'required|string|in:pending,in_progress,closed',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'videos.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:51200',
        ]);

        // Handle file upload first (if any)
        $imagePath = null;
        $fileType = null;

        // Check for images first
        if ($request->hasFile('images') && count($request->file('images')) > 0) {
            $image = $request->file('images')[0]; // Take first image
            $imagePath = $image->store('admin-response-photos', 'public');
            $fileType = 'image/' . $image->getClientOriginalExtension();
        }
        // If no image, check for videos
        elseif ($request->hasFile('videos') && count($request->file('videos')) > 0) {
            $video = $request->file('videos')[0]; // Take first video
            $imagePath = $video->store('admin-response-videos', 'public');
            $fileType = 'video/' . $video->getClientOriginalExtension();
        }

        // Create the response with optional file attachment
        ReportResponse::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'image_path' => $imagePath,
            'file_type' => $fileType,
            'status' => $validated['status'],
        ]);

        // Update report status
        $report->update(['status' => $validated['status']]);

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


