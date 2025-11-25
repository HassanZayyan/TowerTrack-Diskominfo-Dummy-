<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\FeedbackAsset;
use App\Models\Tower;
use App\Services\LocationSecurityService;
use App\Services\CaptchaService;
use App\Http\Requests\StoreMessageResponseRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends MessageableController
{
    /**
     * Configuration for Feedback model.
     */
    protected function getConfig(): array
    {
        return [
            'assets_relation' => 'assets',
            'assets_select' => ['id', 'feedback_id', 'file_path', 'file_type'],
            'responses_select' => ['id', 'feedback_id', 'created_at', 'user_id', 'message', 'sender_type', 'sender_name', 'sender_email', 'sender_phone'],
            'response_assets_relation' => 'assets:id,feedback_response_id,file_path,file_type',
            'phone_field' => 'sender_phone',
            'email_field' => 'email',
            'name_field' => 'sender_name',
            'response_model' => \App\Models\FeedbackResponse::class,
            'response_foreign_key' => 'feedback_id',
            'response_assets_relation_name' => 'assets',
            'response_attachment_disk' => 'public',
            'response_attachment_directories' => [
                'image' => 'feedback-response-photos',
                'video' => 'feedback-response-videos',
            ],
            'asset_model' => FeedbackAsset::class,
            'asset_foreign_key' => 'feedback_id',
            'asset_disk' => 'public',
            'asset_directories' => [
                'image' => 'feedback-photos',
                'video' => 'feedback-videos',
            ],
            'asset_fields' => ['assets', 'foto', 'video'],
        ];
    }
    /**
     * Show feedback form with towers from database.
     */
    public function index(): Response
    {
        $towers = Tower::query()
            ->select([
                'id', 
                'site_name', 
                'alamat_menara',
                'latitude',
                'longitude',
                'tinggi_menara',
                'tinggi_bangunan',
                'jumlah_pengguna',
                'tower_type',
                'site_type'
            ])
            ->orderBy('site_name')
            ->get()
            ->toArray();

        return Inertia::render('Feedback/Create', [
            'towers' => $towers,
        ]);
    }

    /**
     * Store feedback submitted by authenticated user.
     */
    public function store(Request $request)
    {
        $rules = [
            'sender_phone' => 'required|string|max:20', // Phone number is required for all users
            'category' => 'required|string|max:100',
            'tower_id' => 'required|exists:towers,id',
            'message' => 'required|string|max:1000',
            'sender_name' => 'required|string|max:100',
            'email' => isAuthenticated() && (auth()->user()->isComplainant() || auth()->user()->isTowerOwner())
                ? 'prohibited' // Email not allowed for authenticated users (complainant and tower_owner)
                : 'required|email|max:255', // Email now required for anonymous users
            'is_public' => 'required|boolean', // Visibility option
            'reporter_latitude' => 'nullable|numeric',
            'reporter_longitude' => 'nullable|numeric',
            'reporter_accuracy' => 'nullable|numeric',
            // Terima berbagai nama field untuk kompatibilitas frontend
            'assets.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400', // 100MB
            'foto.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400',
            'video.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:102400',
        ];

        // Only require CAPTCHA for guest users (not authenticated)
        $rules = $this->addCaptchaRuleForGuest($rules);

        $validated = $request->validate($rules);

        // Verify CAPTCHA only for guest users
        $captchaError = $this->validateCaptchaForGuest($validated, $request->ip());
        if ($captchaError) {
            return $captchaError;
        }

        // Handle user ID and email for authenticated vs anonymous users
        [$userId, $email] = $this->resolveUserAndEmail($validated);

        // Handle reporter coordinates - completely optional, never blocks submission
        $locationData = [];
        if (!empty($validated['reporter_latitude']) && !empty($validated['reporter_longitude'])) {
            $coordinatesResult = LocationSecurityService::validateCoordinates(
                (float) $validated['reporter_latitude'],
                (float) $validated['reporter_longitude'],
                isset($validated['reporter_accuracy']) ? (float) $validated['reporter_accuracy'] : null
            );
            
            if ($coordinatesResult !== null) {
                $locationData = $coordinatesResult;
            }
            // Always continue - coordinates are completely optional
        }

        $feedbackData = [
            'tower_id' => $validated['tower_id'],
            'user_id' => $userId,
            'email' => $email,
            'sender_phone' => $validated['sender_phone'],
            'sender_name' => $validated['sender_name'],
            'category' => $validated['category'],
            'message' => $validated['message'],
            'is_public' => $validated['is_public'] ?? false,
            'status' => 'pending',
            // Set email_verified_at based on user type
            // Authenticated users are auto-verified, guest users need email verification
            'email_verified_at' => isAuthenticated() ? now() : null,
        ];

        // Merge location data if available
        if (!empty($locationData)) {
            $feedbackData = array_merge($feedbackData, $locationData);
        }

        $config = $this->getConfig();

        $feedback = Feedback::create($feedbackData);

        // Handle file uploads only if files exist for faster response
        if ($this->hasInitialAttachments($request, $config)) {
            $this->storeInitialAttachments($request, $feedback->id, $config);
        }

        // Store guest contact data in cookie for auto-fill (only for guest users)
        if (isGuest()) {
            \App\Helpers\GuestCookieHelper::store([
                'email' => $email,
                'phone' => $validated['sender_phone'],
                'name' => $validated['sender_name'],
            ]);
        }

        // Send email verification for guest users
        $verificationRedirect = $this->sendGuestEmailVerification($feedback, $email, 'feedback');
        if ($verificationRedirect) {
            return $verificationRedirect;
        }

        // Untuk authenticated users, redirect ke halaman success
        return redirect()->route('guest.submission.success', [
            'type' => 'feedback'
        ]);
    }

    /**
     * Show feedback list for regular users
     * Redirect to MyMessages for consistency with Complaint
     */
    public function userFeedbacks()
    {
        // Redirect authenticated users to their posts page
        if (auth()->check()) {
            return redirect()->route('my.messages.myposts');
        }
        
        // For guests, redirect to public messages
        return redirect()->route('my.messages');
    }

    /**
     * Show single feedback detail for user
     * Redirect to MyMessages for consistency with Complaint
     */
    public function show(Feedback $feedback)
    {
        // Check if feedback is public or private
        if ($feedback->is_public) {
            // Redirect to public show page (with comments)
            return redirect()->route('public.feedbacks.show', $feedback);
        } else {
            // For private feedbacks, check access
            if (auth()->check() && $feedback->user_id === auth()->id()) {
                // Authenticated user viewing their own private feedback
                return redirect()->route('public.feedbacks.show', $feedback);
            } else {
                // Redirect to private tracking page
                return redirect()->route('my.messages.private', [
                    'email' => $feedback->email,
                    'phone' => $feedback->sender_phone,
                ]);
            }
        }
    }

    /**
     * Display a public feedback detail page with comments.
     */
    public function showPublic(Feedback $feedback): Response
    {
        $this->validatePublicAccess($feedback, 'Pesan');
        $commentData = $this->loadPublicRelationships($feedback, $this->getConfig());

        return Inertia::render('MyMessages/ShowFeedback', [
            'feedback' => $feedback,
            'statuses' => $this->getStatuses(),
            'comments' => $commentData['comments'] ?? null,
            'commentCount' => $commentData['commentCount'] ?? null,
        ]);
    }

    /**
     * Display a private feedback detail page (without comments).
     */
    public function showPrivate(Feedback $feedback, Request $request): Response
    {
        $config = $this->getConfig();
        [$email, $phone] = $this->validatePrivateAccess($feedback, $request, $config['phone_field']);
        $this->loadPrivateRelationships($feedback, $config);

        return Inertia::render('MyMessages/ShowPrivateFeedback', [
            'feedback' => $feedback,
            'statuses' => $this->getStatuses(),
            'email' => $email,
            'phone' => $phone,
        ]);
    }

    /**
     * Store a response from feedback sender or staff.
     */
    public function storeResponse(StoreMessageResponseRequest $request, Feedback $feedback)
    {
        return $this->handleResponseSubmission($request, $feedback, $this->getConfig());
    }

}
