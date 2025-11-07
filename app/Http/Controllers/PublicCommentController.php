<?php

namespace App\Http\Controllers;

use App\Models\PublicComment;
use App\Models\Report;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class PublicCommentController extends Controller
{
    /**
     * Store a new comment for report.
     */
    public function storeReport(Request $request, Report $report)
    {
        // Ensure report is public
        if (!$report->is_public) {
            return back()->withErrors(['message' => 'Komentar hanya dapat ditambahkan pada pesan publik.']);
        }

        return $this->store($request, Report::class, $report->id);
    }

    /**
     * Store a new comment for feedback.
     */
    public function storeFeedback(Request $request, Feedback $feedback)
    {
        // Ensure feedback is public
        if (!$feedback->is_public) {
            return back()->withErrors(['message' => 'Komentar hanya dapat ditambahkan pada pesan publik.']);
        }

        return $this->store($request, Feedback::class, $feedback->id);
    }

    /**
     * Store a new comment for report or feedback.
     */
    private function store(Request $request, $commentableType, $id)
    {
        // Validate request
        // Explicitly handle nullable parent_id and ensure it's integer or null
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'parent_id' => 'nullable|integer|exists:public_comments,id',
            'guest_name' => auth()->check() ? 'nullable' : 'required|string|max:255',
            'guest_email' => auth()->check() ? 'nullable' : 'required|email|max:255',
            'guest_phone' => 'nullable|string|max:20',
        ]);

        // Best practice: Normalize parent_id to null if empty string or 0
        $parentId = !empty($validated['parent_id']) ? (int) $validated['parent_id'] : null;

        // Validate parent_id if provided
        if ($parentId) {
            $parent = $this->validateParentComment($parentId, $commentableType, $id);
            if ($parent === false) {
                return back()->withErrors(['parent_id' => 'Komentar induk tidak valid atau tidak dapat dibalas.']);
            }
        }

        // Rate limiting
        $key = auth()->check() 
            ? 'comment:user:' . auth()->id()
            : 'comment:ip:' . $request->ip();
        
        $maxAttempts = auth()->check() ? 10 : 5; // Authenticated users get more attempts
        $decaySeconds = 3600; // 1 hour

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'message' => "Terlalu banyak komentar. Silakan coba lagi dalam " . ceil($seconds / 60) . " menit."
            ]);
        }

        // Create comment
        // Use normalized parent_id
        $comment = PublicComment::create([
            'commentable_type' => $commentableType,
            'commentable_id' => $id,
            'parent_id' => $parentId,
            'user_id' => auth()->id(),
            'guest_name' => auth()->check() ? null : $validated['guest_name'],
            'guest_email' => auth()->check() ? null : $validated['guest_email'],
            'guest_phone' => $validated['guest_phone'] ?? null,
            'message' => trim($validated['message']), // Best practice: Trim whitespace
            'is_approved' => true, // Auto-approve (can be changed to false for moderation)
        ]);

        // Hit rate limiter
        RateLimiter::hit($key, $decaySeconds);

        return back()->with('success', 'Komentar berhasil dikirim!');
    }

    /**
     * Validate parent comment.
     * 
     * @return PublicComment|false
     */
    private function validateParentComment($parentId, $commentableType, $commentableId)
    {
        $parent = PublicComment::find($parentId);
        
        if (!$parent) {
            return false;
        }
        
        // Ensure parent belongs to the same commentable
        if ($parent->commentable_type !== $commentableType || 
            $parent->commentable_id !== $commentableId) {
            return false;
        }
        
        return $parent;
    }
}
