<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\FeedbackAsset;
use App\Models\Tower;
use App\Services\LocationSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'responses_select' => ['id', 'feedback_id', 'created_at', 'user_id', 'message'],
            'response_assets_relation' => 'assets:id,feedback_response_id,file_path,file_type',
            'phone_field' => 'sender_phone',
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
        $validated = $request->validate([
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
        ]);

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
            // For anonymous users, email is optional
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

        $feedback = Feedback::create($feedbackData);

        // Handle file uploads only if files exist for faster response
        if ($this->hasAnyFiles($request)) {
            $this->handleFileUploads($request, $feedback->id);
        }

        $message = auth()->check() 
            ? 'Masukan berhasil dikirim! Terima kasih atas masukan Anda.'
            : 'Masukan berhasil dikirim! ' . 
              ($validated['is_public'] 
                ? 'Masukan Anda dapat dilihat di halaman pesan utama.' 
                : 'Untuk melacak status masukan pribadi, gunakan fitur "Lacak Pesan Pribadi" dengan email dan nomor telepon Anda.');

        return redirect()->back()->with('success', $message);
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
     * Quick check if request has any files to upload
     */
    private function hasAnyFiles(Request $request): bool
    {
        return $request->hasFile('foto') || $request->hasFile('assets') || $request->hasFile('video');
    }

    /**
     * Handle file uploads for feedback - optimized method to avoid duplication
     */
    private function handleFileUploads(Request $request, int $feedbackId): void
    {
        // Collect all files from different input fields
        $allFiles = collect();
        
        foreach (['foto', 'assets', 'video'] as $fieldName) {
            if ($request->hasFile($fieldName)) {
                $files = $request->file($fieldName);
                $allFiles = $allFiles->merge(is_array($files) ? $files : [$files]);
            }
        }

        // Process each file
        foreach ($allFiles->filter() as $file) {
            try {
                $mimeType = $file->getMimeType();
                $isImage = str_starts_with($mimeType, 'image/');
                $directory = $isImage ? 'feedback-photos' : 'feedback-videos';

                $path = $file->store($directory, 'public');
                if ($path) {
                    FeedbackAsset::create([
                        'feedback_id' => $feedbackId,
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $isImage ? 'image' : 'video',
                        'mime_type' => $mimeType,
                        'file_size' => $file->getSize(),
                    ]);
                }
            } catch (\Exception $e) {
                // Log error but don't fail the entire request
                \Log::error('Error uploading feedback file: ' . $e->getMessage());
                continue;
            }
        }
    }
}
