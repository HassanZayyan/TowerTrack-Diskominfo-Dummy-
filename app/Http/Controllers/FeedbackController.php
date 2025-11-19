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
            'email' => auth()->check() && (auth()->user()->isComplainant() || auth()->user()->isTowerOwner())
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
        if (!auth()->check()) {
            $rules['cf-turnstile-response'] = 'required|string';
        }

        $validated = $request->validate($rules);

        // Verify CAPTCHA only for guest users
        if (!auth()->check()) {
            $captchaService = app(CaptchaService::class);
            if (!$captchaService->verify(
                $validated['cf-turnstile-response'],
                $request->ip()
            )) {
                return back()->withErrors([
                    'captcha' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.'
                ])->withInput();
            }
        }

        // Handle user ID and email for authenticated vs anonymous users
        $userId = null;
        $email = null;
        
        if (auth()->check()) {
            $userId = auth()->id();
            // For authenticated users (complainant and tower_owner), use their email automatically
            if (auth()->user()->isComplainant() || auth()->user()->isTowerOwner()) {
                $email = auth()->user()->email;
            }
        } else {
            // For anonymous users, email is required
            $email = $validated['email'] ?? null;
        }

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
     */
    public function userFeedbacks()
    {
        $feedbacks = Feedback::with(['tower:id,site_name', 'assets', 'responses.user:id,name'])
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Feedback/Index', [
            'feedbacks' => $feedbacks,
        ]);
    }

    /**
     * Show single feedback detail for user
     */
    public function show(Feedback $feedback)
    {
        // Ensure user can only see their own feedback
        if ($feedback->user_id !== auth()->id() && !auth()->user()->isStaff()) {
            abort(403);
        }

        $feedback->load([
            'tower:id,site_name,alamat_menara',
            'user:id,name,email',
            'assets',
            'responses.user:id,name',
            'responses.assets'
        ]);

        return Inertia::render('Feedback/Show', [
            'feedback' => $feedback,
        ]);
    }

    /**
     * Display a public feedback detail page with comments.
     */
    public function showPublic(Feedback $feedback): Response
    {
        $this->validatePublicAccess($feedback, 'Pesan');
        $comments = $this->loadPublicRelationships($feedback, $this->getConfig());

        return Inertia::render('MyMessages/ShowFeedback', [
            'feedback' => $feedback,
            'statuses' => $this->getStatuses(),
            'comments' => $comments,
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
