<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\FeedbackAsset;
use App\Models\Tower;
use App\Models\FoPoint;
use App\Services\LocationSecurityService;
use App\Services\CaptchaService;
use App\Http\Requests\StoreMessageResponseRequest;
use App\Rules\PhoneNumber;
use App\Helpers\PhoneHelper;
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
     * Show feedback form with towers and FO points from database.
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

        $foPoints = FoPoint::query()
            ->orderBy('name')
            ->get()
            ->map(function ($point) {
                return [
                    'id' => $point->id,
                    'name' => $point->name,
                    'latitude' => (float) $point->latitude,
                    'longitude' => (float) $point->longitude,
                    'area' => $point->area,
                    'route_name' => $point->route_name,
                    'type' => $point->type,
                    'status' => $point->status,
                    'description' => $point->description,
                    'side_of_road' => $point->side_of_road ?? 'unknown',
                    'images' => [
                        'isp' => $point->isp_image_url,
                        'pole' => $point->pole_image_url,
                        'junction_box' => $point->junction_box_image_url,
                    ],
                ];
            })
            ->toArray();

        return Inertia::render('Feedback/Create', [
            'towers' => $towers,
            'foPoints' => $foPoints,
        ]);
    }

    /**
     * Store feedback submitted by authenticated user.
     */
    public function store(Request $request)
    {
        $rules = [
            'sender_phone' => ['required', 'string', 'max:20', new PhoneNumber()], // Phone number is required for all users
            'category' => 'required|string|max:100',
            'feedbackable_type' => 'required|in:App\\Models\\Tower,App\\Models\\FoPoint',
            'feedbackable_id' => [
                'required',
                function ($attribute, $value, $fail) use ($request) {
                    $type = $request->input('feedbackable_type');
                    if ($type === 'App\\Models\\Tower') {
                        if (!Tower::find($value)) {
                            $fail('Tower tidak ditemukan.');
                        }
                    } elseif ($type === 'App\\Models\\FoPoint') {
                        if (!FoPoint::find($value)) {
                            $fail('FO Point tidak ditemukan.');
                        }
                    } else {
                        $fail('Tipe lokasi tidak valid.');
                    }
                },
            ],
            'message' => 'required|string|max:1000',
            'sender_name' => 'required|string|max:100',
            'email' => isAuthenticated() && auth()->user()->shouldAutoFillContactInfo()
                ? 'prohibited' // Email not allowed for authenticated users who should auto-fill
                : 'required|email|max:255', // Email required for anonymous users
            'is_public' => 'required|boolean', // Visibility option
            // Accept both reporter_* (for backward compatibility) and sender_* (new format)
            'reporter_latitude' => 'nullable|numeric',
            'reporter_longitude' => 'nullable|numeric',
            'reporter_accuracy' => 'nullable|numeric',
            'sender_latitude' => 'nullable|numeric',
            'sender_longitude' => 'nullable|numeric',
            'sender_accuracy' => 'nullable|numeric',
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

        // Validate private message access (must be authenticated)
        $this->validatePrivateMessageAccess($validated);

        // Handle user ID and email for authenticated vs anonymous users
        [$userId, $email] = $this->resolveUserAndEmail($validated);

        // Handle sender coordinates - completely optional, never blocks submission
        // Accept both reporter_* (for backward compatibility) and sender_* (new format)
        $locationData = [];
        $latitude = $validated['sender_latitude'] ?? $validated['reporter_latitude'] ?? null;
        $longitude = $validated['sender_longitude'] ?? $validated['reporter_longitude'] ?? null;
        $accuracy = $validated['sender_accuracy'] ?? $validated['reporter_accuracy'] ?? null;
        
        if (!empty($latitude) && !empty($longitude)) {
            $coordinatesResult = LocationSecurityService::validateCoordinates(
                (float) $latitude,
                (float) $longitude,
                $accuracy !== null ? (float) $accuracy : null
            );
            
            if ($coordinatesResult !== null) {
                // Map reporter_* fields to sender_* fields for feedbacks
                $locationData = [
                    'sender_latitude' => $coordinatesResult['reporter_latitude'],
                    'sender_longitude' => $coordinatesResult['reporter_longitude'],
                    'location_captured_at' => $coordinatesResult['location_captured_at'],
                ];
                if (isset($coordinatesResult['reporter_accuracy'])) {
                    $locationData['sender_accuracy'] = $coordinatesResult['reporter_accuracy'];
                }
            }
            // Always continue - coordinates are completely optional
        }

        $feedbackData = [
            'feedbackable_type' => $validated['feedbackable_type'],
            'feedbackable_id' => $validated['feedbackable_id'],
            'user_id' => $userId,
            'email' => $email,
            'sender_phone' => PhoneHelper::normalize($validated['sender_phone']),
            'sender_name' => $validated['sender_name'],
            'category' => $validated['category'],
            'message' => $validated['message'],
            'is_public' => $validated['is_public'] ?? false,
            'status_id' => 1, // 1 = pending
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
        // Normalize phone number before storing to ensure consistency with database format
        if (isGuest()) {
            \App\Helpers\GuestCookieHelper::store([
                'email' => $email,
                'phone' => PhoneHelper::normalize($validated['sender_phone']),
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
            // For private feedbacks, require authentication
            if (auth()->check() && $feedback->user_id === auth()->id()) {
                // Authenticated user viewing their own private feedback
                return redirect()->route('public.feedbacks.show', $feedback);
            } else {
                // Not authenticated or not owner - redirect to my-posts or login
                if (auth()->check()) {
                    return redirect()->route('my.messages.myposts');
                } else {
                    return redirect()->route('login')->withErrors([
                        'message' => 'Anda harus login untuk mengakses pesan pribadi.'
                    ]);
                }
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
     * Requires authentication.
     */
    public function showPrivate(Feedback $feedback, Request $request): Response
    {
        $config = $this->getConfig();
        $this->validatePrivateAccess($feedback, $request, $config['phone_field']);
        $this->loadPrivateRelationships($feedback, $config);

        return Inertia::render('MyMessages/ShowPrivateFeedback', [
            'feedback' => $feedback,
            'statuses' => $this->getStatuses(),
        ]);
    }

    /**
     * Store a response from feedback sender or staff.
     * This is the public route - admin/operator should use admin pages for official responses.
     */
    public function storeResponse(StoreMessageResponseRequest $request, Feedback $feedback)
    {
        return $this->handleResponseSubmission($request, $feedback, $this->getConfig(), true);
    }

}
