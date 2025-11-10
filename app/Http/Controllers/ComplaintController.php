<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportAsset;
use App\Models\Tower;
use App\Services\LocationSecurityService;
use App\Http\Requests\StoreMessageResponseRequest;
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
     * Show complaint form with towers from database (no CSV).
     */
    public function index(): Response
    {
        $list = Tower::query()
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

        return Inertia::render('Complaint/Create', [
            'towers' => $list,
        ]);
    }

    /**
     * Store complaint submitted by authenticated or anonymous user.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nama' => 'nullable|string|max:255',
                'telepon' => 'required|string|max:20', // Phone number is required for all users
                'kategori' => 'required|string|max:100',
                'lokasi_tower' => 'required|string|max:255',
                'tower_id' => 'required|exists:towers,id',
                'pesan' => 'required|string|max:1000',
                'email' => auth()->check() && (auth()->user()->isComplainant() || auth()->user()->isTowerOwner())
                    ? 'prohibited' // Email not allowed for authenticated users (both complainant and tower_owner)
                    : 'required|email|max:255', // Email required for anonymous users
                'is_public' => 'required|boolean', // Visibility option
                'reporter_latitude' => 'nullable|numeric',
                'reporter_longitude' => 'nullable|numeric',
                'reporter_accuracy' => 'nullable|numeric',
                'foto.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400',
                'video.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:102400',
                'assets.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error: ' . json_encode($e->errors()));
            return back()->withErrors($e->errors())->withInput();
        }

        // Handle user ID and email for authenticated vs anonymous users
        $userId = null;
        $email = null;
        
        if (auth()->check()) {
            $userId = auth()->id();
            // For authenticated users (both complainant and tower_owner), use their email automatically
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

        // Always set status_id to 1 (pending) for new complaints
        $reportData = [
            'tower_id' => $validated['tower_id'],
            'user_id' => $userId,
            'email' => $email,
            'reporter_name' => $validated['nama'] ?? (auth()->check() ? $request->user()->name : null),
            'reporter_phone' => $validated['telepon'],
            'category' => $validated['kategori'],
            'message' => $validated['pesan'],
            'is_public' => $validated['is_public'] ?? false,
            'status_id' => 1, // 1 = pending
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

        $message = auth()->check() 
            ? 'Keluhan berhasil dikirim! Terima kasih atas laporan Anda.'
            : 'Keluhan berhasil dikirim! ' . 
              ($validated['is_public'] 
                ? 'Keluhan Anda dapat dilihat di halaman pesan utama.' 
                : 'Untuk melacak status keluhan pribadi, gunakan fitur "Lacak Pesan Pribadi" dengan email dan nomor telepon Anda.');

        return redirect()->back()->with('success', $message);
    }

    /**
     * Display a public report detail page with comments.
     */
    public function showPublic(Report $report): Response
    {
        $this->validatePublicAccess($report, 'Pesan');
        $comments = $this->loadPublicRelationships($report, $this->getConfig());

        return Inertia::render('MyMessages/ShowReport', [
            'report' => $report,
            'statuses' => $this->getStatuses(),
            'comments' => $comments,
        ]);
    }

    /**
     * Display a private report detail page (without comments).
     */
    public function showPrivate(Report $report, Request $request): Response
    {
        $config = $this->getConfig();
        [$email, $phone] = $this->validatePrivateAccess($report, $request, $config['phone_field']);
        $this->loadPrivateRelationships($report, $config);

        return Inertia::render('MyMessages/ShowPrivateReport', [
            'report' => $report,
            'statuses' => $this->getStatuses(),
            'email' => $email,
            'phone' => $phone,
        ]);
    }

    /**
     * Store a response from reporter or staff.
     */
    public function storeResponse(StoreMessageResponseRequest $request, Report $report)
    {
        return $this->handleResponseSubmission($request, $report, $this->getConfig());
    }
}


