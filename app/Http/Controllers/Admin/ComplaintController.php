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
                'images:id,report_id,file_path,file_type', 
                'user:id,name,email',
                'responses.user:id,name',
                'responses.assets:id,report_response_id,file_path,file_type'
            ])
            ->orderByDesc('created_at')
            ->get();

        // Get statuses if the table exists, otherwise use default statuses
        try {
            $statuses = Status::all(['id', 'name', 'slug', 'color', 'icon']);
        } catch (\Exception $e) {
            // If table doesn't exist, use default statuses
            $statuses = collect([
                ['id' => 1, 'name' => 'Pending', 'slug' => 'pending', 'color' => 'red', 'icon' => 'clock'],
                ['id' => 2, 'name' => 'In Progress', 'slug' => 'in_progress', 'color' => 'orange', 'icon' => 'refresh'],
                ['id' => 3, 'name' => 'Closed', 'slug' => 'closed', 'color' => 'green', 'icon' => 'check'],
            ]);
        }

        return Inertia::render('Admin/Complaints', [
            'reports' => $reports,
            'statuses' => $statuses,
        ]);
    }

    public function show(Report $report)
    {
        $report->load([
            'tower:id,site_name,alamat_menara',
            'user:id,name,email',
            'images',
            'responses.user:id,name',
            'responses.assets'
        ]);

        return Inertia::render('Admin/Reports/Show', [
            'report' => $report
        ]);
    }

    public function respond(Request $request, Report $report)
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:1000',
            'status_id' => 'required',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'videos.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:51200',
        ]);

        try {
            // Create response only if there's a message
            $response = null;
            if (!empty($validated['message'])) {
                $response = ReportResponse::create([
                    'report_id' => $report->id,
                    'user_id' => $request->user()->id,
                    'message' => $validated['message'],
                ]);
            }
            
            // Process images only if there's a response
            if ($response && $request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $filePath = $image->store('admin-response-photos', 'public');
                    $fileType = 'image';
                    $mimeType = $image->getClientMimeType();
                    
                    $response->assets()->create([
                        'file_path' => $filePath,
                        'file_name' => $image->getClientOriginalName(),
                        'file_type' => $fileType,
                        'mime_type' => $mimeType,
                        'file_size' => $image->getSize(),
                    ]);
                }
            }
            
            // Process videos only if there's a response
            if ($response && $request->hasFile('videos')) {
                foreach ($request->file('videos') as $video) {
                    $filePath = $video->store('admin-response-videos', 'public');
                    $fileType = 'video';
                    $mimeType = $video->getClientMimeType();
                    
                    $response->assets()->create([
                        'file_path' => $filePath,
                        'file_name' => $video->getClientOriginalName(),
                        'file_type' => $fileType,
                        'mime_type' => $mimeType,
                        'file_size' => $video->getSize(),
                    ]);
                }
            }

            // Set the status for this response if the method exists and response exists
            if ($response && method_exists($response, 'setStatus')) {
                $response->setStatus($validated['status_id']);
            }
            
            // Update report status
            $report->update(['status_id' => $validated['status_id']]);

        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error responding to complaint: ' . $e->getMessage());
            
            // If response creation failed and there was supposed to be a message, try again
            if (!isset($response) && !empty($validated['message'])) {
                $response = ReportResponse::create([
                    'report_id' => $report->id,
                    'user_id' => $request->user()->id,
                    'message' => $validated['message'],
                ]);
            }
        }

        return back();
    }

    public function updateStatus(Request $request, Report $report)
    {
        $validated = $request->validate([
            'status_id' => 'required',
        ]);

        // Ubah slug ke id status
        $statusSlug = $validated['status_id'];
        $statusModel = Status::where('slug', $statusSlug)->first();
        $statusId = $statusModel ? $statusModel->id : $validated['status_id'];

        try {
            $report->update(['status_id' => $statusId]);

            // Create a response if there's a message
            if ($request->has('message') && !empty($request->message)) {
                $response = ReportResponse::create([
                    'report_id' => $report->id,
                    'user_id' => $request->user()->id,
                    'message' => $request->message,
                ]);

                // Set the status for this response if the method exists
                if (method_exists($response, 'setStatus')) {
                    $response->setStatus($statusId);
                }
            }
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error updating status: ' . $e->getMessage());

            // Still create the response if there's a message
            if ($request->has('message') && !empty($request->message)) {
                ReportResponse::create([
                    'report_id' => $report->id,
                    'user_id' => $request->user()->id,
                    'message' => $request->message,
                ]);
            }
        }

        return back();
    }
}


