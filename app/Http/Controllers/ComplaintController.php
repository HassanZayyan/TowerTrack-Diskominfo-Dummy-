<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportAsset;
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

class ComplaintController extends MessageableController
{
    /**
     * Configuration for Report model.
     */
    protected function getConfig(): array
    {
        return [
            'assets_relation' => 'images',
            'assets_select' => ['id', 'report_id', 'file_path', 'file_type'],
            'responses_select' => ['id', 'report_id', 'message', 'created_at', 'user_id', 'sender_type', 'sender_name', 'sender_email', 'sender_phone'],
            'response_assets_relation' => 'assets:id,report_response_id,file_path,file_type',
            'phone_field' => 'reporter_phone',
            'email_field' => 'email',
            'name_field' => 'reporter_name',
            'response_model' => \App\Models\ReportResponse::class,
            'response_foreign_key' => 'report_id',
            'response_assets_relation_name' => 'assets',
            'response_attachment_disk' => 'public',
            'response_attachment_directories' => [
                'image' => 'report-response-photos',
                'video' => 'report-response-videos',
            ],
            'asset_model' => ReportAsset::class,
            'asset_foreign_key' => 'report_id',
            'asset_disk' => 'public',
            'asset_directories' => [
                'image' => 'report-photos',
                'video' => 'report-videos',
            ],
            'asset_fields' => ['foto', 'assets', 'video'],
        ];
    }
    /**
     * Show complaint form with towers and FO points from database.
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

        return Inertia::render('Complaint/Create', [
            'towers' => $towers,
            'foPoints' => $foPoints,
        ]);
    }

    /**
     * Store complaint submitted by authenticated or anonymous user.
     */
    public function store(Request $request)
    {
        try {
            $rules = [
                'nama' => 'nullable|string|max:255',
                'telepon' => ['required', 'string', 'max:20', new PhoneNumber()], // Phone number is required for all users
                'kategori' => 'required|string|max:100',
                'lokasi_tower' => 'nullable|string|max:255', // Made nullable, can be tower or FO point name
                'reportable_type' => 'required|in:App\\Models\\Tower,App\\Models\\FoPoint',
                'reportable_id' => [
                    'required',
                    function ($attribute, $value, $fail) use ($request) {
                        $type = $request->input('reportable_type');
                        if ($type === 'App\\Models\\Tower') {
                            if (!Tower::find($value)) {
                                $fail('Menara tidak ditemukan.');
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
            'pesan' => 'required|string|max:1000',
            'email' => isAuthenticated() && auth()->user()->shouldAutoFillContactInfo()
                ? 'prohibited' // Email not allowed for authenticated users who should auto-fill
                : 'required|email|max:255', // Email required for anonymous users
                'is_public' => 'required|boolean', // Visibility option
                'reporter_latitude' => 'nullable|numeric',
                'reporter_longitude' => 'nullable|numeric',
                'reporter_accuracy' => 'nullable|numeric',
                'foto.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400',
                'video.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:102400',
                'assets.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400',
            ];

            // Only require CAPTCHA for guest users
            $rules = $this->addCaptchaRuleForGuest($rules);

            $validated = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error: ' . json_encode($e->errors()));
            return back()->withErrors($e->errors())->withInput();
        }

        // Verify CAPTCHA only for guest users
        $captchaError = $this->validateCaptchaForGuest($validated, $request->ip());
        if ($captchaError) {
            return $captchaError;
        }

        // Validate private message access (must be authenticated)
        $this->validatePrivateMessageAccess($validated);

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

        // Always set status_id to 1 (pending) for new complaints
        $reportData = [
            'reportable_type' => $validated['reportable_type'],
            'reportable_id' => $validated['reportable_id'],
            'user_id' => $userId,
            'email' => $email,
            'reporter_name' => $validated['nama'] ?? (isAuthenticated() ? $request->user()->name : null),
            'reporter_phone' => PhoneHelper::normalize($validated['telepon']),
            'category' => $validated['kategori'],
            'message' => $validated['pesan'],
            'is_public' => $validated['is_public'] ?? false,
            'status_id' => 1, // 1 = pending
            // Set email_verified_at based on user type
            // Authenticated users are auto-verified, guest users need email verification
            'email_verified_at' => isAuthenticated() ? now() : null,
        ];

        // Merge location data if available
        if (!empty($locationData)) {
            $reportData = array_merge($reportData, $locationData);
        }

        $config = $this->getConfig();

        $report = Report::create($reportData);

        // Handle file uploads only if files exist for faster response
        if ($this->hasInitialAttachments($request, $config)) {
            $this->storeInitialAttachments($request, $report->id, $config);
        }

        // Store guest contact data in cookie for auto-fill (only for guest users)
        // Normalize phone number before storing to ensure consistency with database format
        if (isGuest()) {
            \App\Helpers\GuestCookieHelper::store([
                'email' => $email,
                'phone' => PhoneHelper::normalize($validated['telepon']),
                'name' => $validated['nama'] ?? null,
            ]);
        }

        // Send email verification for guest users
        $verificationRedirect = $this->sendGuestEmailVerification($report, $email, 'complaint');
        if ($verificationRedirect) {
            return $verificationRedirect;
        }

        // Untuk authenticated users, redirect ke halaman success
        return redirect()->route('guest.submission.success', [
            'type' => 'complaint'
        ]);
    }

    /**
     * Display a public report detail page with comments.
     */
    public function showPublic(Report $report): Response
    {
        $this->validatePublicAccess($report, 'Pesan');
        $commentData = $this->loadPublicRelationships($report, $this->getConfig());

        return Inertia::render('MyMessages/ShowReport', [
            'report' => $report,
            'statuses' => $this->getStatuses(),
            'comments' => $commentData['comments'] ?? null,
            'commentCount' => $commentData['commentCount'] ?? null,
        ]);
    }

    /**
     * Display a private report detail page (without comments).
     * Requires authentication.
     */
    public function showPrivate(Report $report, Request $request): Response
    {
        $config = $this->getConfig();
        $this->validatePrivateAccess($report, $request, $config['phone_field']);
        $this->loadPrivateRelationships($report, $config);

        return Inertia::render('MyMessages/ShowPrivateReport', [
            'report' => $report,
            'statuses' => $this->getStatuses(),
        ]);
    }

    /**
     * Store a response from reporter or staff.
     * This is the public route - admin/operator should use admin pages for official responses.
     */
    public function storeResponse(StoreMessageResponseRequest $request, Report $report)
    {
        return $this->handleResponseSubmission($request, $report, $this->getConfig(), true);
    }
}


