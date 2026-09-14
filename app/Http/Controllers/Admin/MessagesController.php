<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Feedback;
use App\Traits\HasStatusHandling;
use App\Traits\HasMessageableRelationships;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessagesController extends Controller
{
    use HasStatusHandling, HasMessageableRelationships;

    public function index(Request $request)
    {
        $reports = Report::with($this->getReportRelationships())
            ->select('id', 'user_id', 'reportable_type', 'reportable_id', 'email', 'reporter_name', 'reporter_phone', 'category', 'message', 'status_id', 'reporter_latitude', 'reporter_longitude', 'reporter_accuracy', 'location_captured_at', 'is_public', 'created_at', 'updated_at')
            ->orderByDesc('created_at')
            ->get();

        $feedbacks = Feedback::with($this->getFeedbackRelationships())
            ->select('id', 'user_id', 'feedbackable_type', 'feedbackable_id', 'email', 'sender_name', 'sender_phone', 'category', 'message', 'status_id', 'sender_latitude', 'sender_longitude', 'sender_accuracy', 'location_captured_at', 'is_public', 'created_at', 'updated_at')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Admin/Messages/Index', [
            'reports' => $reports,
            'feedbacks' => $feedbacks,
            'statuses' => $this->getStatuses(), // Use trait method
        ]);
    }
}


