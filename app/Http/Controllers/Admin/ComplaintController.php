<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportResponse;
use App\Models\Status;
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
                'status:id,name,slug,color,icon',
                'responses' => function($query) {
                    $query->with(['statuses:id,name,slug,color,icon']);
                }
            ])
            ->orderByDesc('created_at')
            ->get();

        $statuses = Status::all(['id', 'name', 'slug', 'color', 'icon']);

        return Inertia::render('Admin/Complaints', [
            'reports' => $reports,
            'statuses' => $statuses,
        ]);
    }

    public function respond(Request $request, Report $report)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'status_id' => 'required|exists:statuses,id',
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
        $response = ReportResponse::create([
            'report_id' => $report->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'image_path' => $imagePath,
            'file_type' => $fileType,
        ]);

        // Set the status for this response
        $response->setStatus($validated['status_id']);
        
        // Update report status
        $report->update(['status_id' => $validated['status_id']]);

        return back();
    }

    public function updateStatus(Request $request, Report $report)
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:statuses,id',
        ]);
        
        $report->update(['status_id' => $validated['status_id']]);
        
        // Create a response if there's a message
        if ($request->has('message') && !empty($request->message)) {
            $response = ReportResponse::create([
                'report_id' => $report->id,
                'user_id' => $request->user()->id,
                'message' => $request->message,
            ]);
            
            // Set the status for this response
            $response->setStatus($validated['status_id']);
        }
        
        return back();
    }
}


