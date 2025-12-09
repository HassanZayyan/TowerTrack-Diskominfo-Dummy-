<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Traits\HasStatusHandling;
use App\Traits\HasAdminResponseHandling;
use App\Traits\HasMessageableRelationships;
use App\Traits\HasStatusUpdateWithResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    use HasStatusHandling, HasAdminResponseHandling, HasMessageableRelationships, HasStatusUpdateWithResponse;

    /**
     * Get configuration for Feedback responses.
     * 
     * @return array
     */
    protected function getResponseConfig(): array
    {
        return [
            'response_model' => \App\Models\FeedbackResponse::class,
            'response_foreign_key' => 'feedback_id',
            'response_asset_model' => \App\Models\FeedbackResponseAsset::class,
            'response_asset_foreign_key' => 'feedback_response_id',
            'response_image_directory' => 'feedback-response-photos',
            'response_video_directory' => 'feedback-response-videos',
        ];
    }

    /**
     * Display a listing of feedbacks for admin
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status', 'all');
        
        $query = Feedback::with($this->getFeedbackRelationships())
            ->orderByDesc('created_at');
            
        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhereHas('feedbackable', function ($feedbackableQuery) use ($search) {
                      // Search in both Tower (site_name) and FoPoint (name) columns
                      $feedbackableQuery->where(function($subQuery) use ($search) {
                          $subQuery->where('site_name', 'like', "%{$search}%")
                                   ->orWhere('name', 'like', "%{$search}%");
                      });
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

        return Inertia::render('Admin/Feedback/Index', [
            'feedbacks' => $feedbacks,
            'statuses' => $this->getStatuses(),
        ]);
    }

    /**
     * Show single feedback detail for admin
     */
    public function show(Feedback $feedback)
    {
        $feedback->load($this->getFeedbackRelationships());

        return Inertia::render('Admin/Feedback/Show', [
            'feedback' => $feedback,
            'statuses' => $this->getStatuses()
        ]);
    }

    /**
     * Store admin response to feedback
     */
    public function respond(Request $request, Feedback $feedback)
    {
        $config = $this->getResponseConfig();
        $this->createAdminResponse($request, $feedback, $config);
        return back();
    }

    /**
     * Update feedback status
     */
    public function updateStatus(Request $request, Feedback $feedback)
    {
        $config = $this->getResponseConfig();
        $this->updateStatusWithResponse($request, $feedback, $config);
        return back();
    }
}