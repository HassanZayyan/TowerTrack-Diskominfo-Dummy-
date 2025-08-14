<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\FeedbackResponse;
use App\Models\FeedbackResponseAsset;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    /**
     * Display a listing of feedbacks for admin
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $status = $request->get('status', 'all');
        $perPage = 15;

        $query = Feedback::with(['tower:id,site_name', 'user:id,name,email', 'assets'])
            ->orderBy('created_at', 'desc');

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

        $feedbacks = $query->paginate($perPage);

        return Inertia::render('Admin/Feedback/Index', [
            'feedbacks' => $feedbacks,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show single feedback detail for admin
     */
    public function show(Feedback $feedback): Response
    {
        $feedback->load([
            'tower:id,site_name,alamat_menara',
            'user:id,name,email',
            'assets',
            'responses.user:id,name',
            'responses.assets'
        ]);

        return Inertia::render('Admin/Feedback/Show', [
            'feedback' => $feedback,
        ]);
    }

    /**
     * Store admin response to feedback
     */
    public function respond(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'status' => 'required|in:pending,in_progress,responded,resolved,closed',
            'assets.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi|max:20480',
        ]);

        $response = FeedbackResponse::create([
            'feedback_id' => $feedback->id,
            'user_id' => auth()->id(),
            'message' => $validated['message'],
        ]);

        // Handle file uploads for response
        if ($request->hasFile('assets')) {
            foreach ($request->file('assets') as $file) {
                $path = $file->store('feedback-response-assets', 'public');
                $fileType = str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'video';
                
                FeedbackResponseAsset::create([
                    'feedback_response_id' => $response->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $fileType,
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        // Update feedback status
        $feedback->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Balasan berhasil dikirim!');
    }

    /**
     * Update feedback status
     */
    public function updateStatus(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,responded,resolved,closed',
        ]);

        $feedback->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Status feedback berhasil diperbarui!');
    }
}
