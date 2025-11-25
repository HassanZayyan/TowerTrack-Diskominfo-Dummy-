<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\FeedbackResponse;
use App\Models\FeedbackResponseAsset;
use App\Models\Status;
use App\Traits\HasStatusHandling;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    use HasStatusHandling;
    /**
     * Display a listing of feedbacks for admin
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status', 'all');
        
        $query = Feedback::with([
                'tower:id,site_name,alamat_menara', 
                'assets:id,feedback_id,file_path,file_type', 
                'user:id,name,email',
                'responses' => function($query) {
                    $query->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
                }
            ])
            ->orderByDesc('created_at');
            
        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhereHas('tower', function ($towerQuery) use ($search) {
                      $towerQuery->where('site_name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Apply status filter
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        
        $feedbacks = $query->get();

        // Get statuses using trait method
        $statuses = $this->getStatuses();

        return Inertia::render('Admin/Feedback/Index', [
            'feedbacks' => $feedbacks,
            'statuses' => $statuses,
        ]);
    }

    /**
     * Show single feedback detail for admin
     */
    public function show(Feedback $feedback)
    {
        $feedback->load([
            'tower:id,site_name,alamat_menara',
            'user:id,name,email',
            'assets',
            'responses.user:id,name',
            'responses.assets'
        ]);

        // Get statuses using trait method
        $statuses = $this->getStatuses();

        return Inertia::render('Admin/Feedback/Show', [
            'feedback' => $feedback,
            'statuses' => $statuses
        ]);
    }

    /**
     * Store admin response to feedback
     */
    public function respond(Request $request, Feedback $feedback)
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
                $response = FeedbackResponse::create([
                    'feedback_id' => $feedback->id,
                    'user_id' => $request->user()->id,
                    'sender_type' => 'staff',
                    'sender_name' => $request->user()->name,
                    'sender_email' => $request->user()->email,
                    'message' => $validated['message'],
                ]);
            }
            
            // Now handle file uploads and store them in feedback_response_assets
            // Process images only if there's a response
            if ($response && $request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $filePath = $image->store('feedback-response-photos', 'public');
                    $fileType = 'image';
                    $mimeType = $image->getClientMimeType();
                    
                    FeedbackResponseAsset::create([
                        'feedback_response_id' => $response->id,
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
                    $filePath = $video->store('feedback-response-videos', 'public');
                    $fileType = 'video';
                    $mimeType = $video->getClientMimeType();
                    
                    FeedbackResponseAsset::create([
                        'feedback_response_id' => $response->id,
                        'file_path' => $filePath,
                        'file_name' => $video->getClientOriginalName(),
                        'file_type' => $fileType,
                        'mime_type' => $mimeType,
                        'file_size' => $video->getSize(),
                    ]);
                }
            }
            
            // Convert status_id to status string if needed
            $statusMap = [
                '1' => 'pending',
                '2' => 'in_progress',
                '3' => 'closed'
            ];
            
            $statusValue = $validated['status_id'];
            if (is_numeric($statusValue) && isset($statusMap[$statusValue])) {
                $statusValue = $statusMap[$statusValue];
            }

            // Update feedback status
            $feedback->update(['status' => $statusValue]);

        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error responding to feedback: ' . $e->getMessage());
            
            // If response creation failed and there was supposed to be a message, try again
            if (!isset($response) && !empty($validated['message'])) {
                $response = FeedbackResponse::create([
                    'feedback_id' => $feedback->id,
                    'user_id' => $request->user()->id,
                    'sender_type' => 'staff',
                    'sender_name' => $request->user()->name,
                    'sender_email' => $request->user()->email,
                    'message' => $validated['message'],
                ]);
            }
        }

        return back();
    }

    /**
     * Update feedback status
     */
    public function updateStatus(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'status_id' => 'required',
        ]);
        
        try {
            // Convert status_id to status string if needed
            $statusMap = [
                '1' => 'pending',
                '2' => 'in_progress',
                '3' => 'closed'
            ];
            
            $statusValue = $validated['status_id'];
            if (is_numeric($statusValue) && isset($statusMap[$statusValue])) {
                $statusValue = $statusMap[$statusValue];
            }
            
            // Update feedback status
            $feedback->update(['status' => $statusValue]);
            
            // Create a response if there's a message
            if ($request->has('message') && !empty($request->message)) {
                $response = FeedbackResponse::create([
                    'feedback_id' => $feedback->id,
                    'user_id' => $request->user()->id,
                    'sender_type' => 'staff',
                    'sender_name' => $request->user()->name,
                    'sender_email' => $request->user()->email,
                    'message' => $request->message,
                ]);
            }
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error updating status: ' . $e->getMessage());
            
            // Still create the response if there's a message
            if ($request->has('message') && !empty($request->message)) {
                FeedbackResponse::create([
                    'feedback_id' => $feedback->id,
                    'user_id' => $request->user()->id,
                    'sender_type' => 'staff',
                    'sender_name' => $request->user()->name,
                    'sender_email' => $request->user()->email,
                    'message' => $request->message,
                ]);
            }
        }
        
        return back();
    }
}