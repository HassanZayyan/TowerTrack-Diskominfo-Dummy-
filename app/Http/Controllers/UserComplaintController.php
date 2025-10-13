<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportAsset;
use App\Models\Tower;
use App\Services\LocationSecurityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserComplaintController extends Controller
{
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
                'email' => auth()->check() && auth()->user()->isComplainant() 
                    ? 'prohibited' // Email not allowed for authenticated complainant users
                    : 'required|email|max:255', // Email now required for anonymous users
                'is_public' => 'required|boolean', // Visibility option
                'reporter_latitude' => 'nullable|numeric|between:-90,90',
                'reporter_longitude' => 'nullable|numeric|between:-180,180',
                'reporter_accuracy' => 'nullable|numeric|min:0|max:10000',
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
            // For authenticated complainant users, use their email automatically
            if (auth()->user()->isComplainant()) {
                $email = auth()->user()->email;
            }
        } else {
            // For anonymous users, email is optional
            $email = $validated['email'] ?? null;
        }

        // Handle reporter coordinates if provided
        $locationData = [];
        \Log::info('Received coordinates:', [
            'reporter_latitude' => $validated['reporter_latitude'] ?? 'not provided',
            'reporter_longitude' => $validated['reporter_longitude'] ?? 'not provided',
            'reporter_accuracy' => $validated['reporter_accuracy'] ?? 'not provided'
        ]);
        
        if (!empty($validated['reporter_latitude']) && !empty($validated['reporter_longitude'])) {
            try {
                $locationData = LocationSecurityService::validateCoordinates(
                    (float) $validated['reporter_latitude'],
                    (float) $validated['reporter_longitude'],
                    isset($validated['reporter_accuracy']) ? (float) $validated['reporter_accuracy'] : null
                );
                \Log::info('Coordinates validated successfully:', $locationData);
            } catch (\InvalidArgumentException $e) {
                \Log::warning('Invalid coordinates provided: ' . $e->getMessage());
                // Continue without coordinates rather than failing the request
            }
        } else {
            \Log::info('No coordinates provided in request');
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
            \Log::info('Report data with coordinates:', $reportData);
        } else {
            \Log::info('Report data without coordinates:', $reportData);
        }

        $report = Report::create($reportData);
        \Log::info('Report created with ID: ' . $report->id, [
            'reporter_latitude' => $report->reporter_latitude,
            'reporter_longitude' => $report->reporter_longitude,
            'reporter_accuracy' => $report->reporter_accuracy,
            'location_captured_at' => $report->location_captured_at
        ]);

        // Handle uploads (images and/or videos) submitted under "foto" or a generic "assets" key
        try {
            $filesFromFoto = $request->file('foto', []);
            $filesFromAssets = $request->file('assets', []);
            $allFiles = array_filter(array_merge($filesFromFoto, $filesFromAssets));

            if (!empty($allFiles)) {
                foreach ($allFiles as $file) {
                    try {
                        $mimeType = $file->getClientMimeType();
                        $isImage = str_starts_with($mimeType, 'image/');
                        $directory = $isImage ? 'report-photos' : 'report-videos';

                        $path = $file->store($directory, 'public');
                        if (!$path) {
                            \Log::error('Failed to store file: ' . $file->getClientOriginalName());
                            continue;
                        }
                        
                        ReportAsset::create([
                            'report_id' => $report->id,
                            'file_path' => $path,
                            'file_name' => $file->getClientOriginalName(),
                            'file_type' => $isImage ? 'image' : 'video',
                            'mime_type' => $mimeType,
                            'file_size' => $file->getSize(),
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Error uploading file: ' . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error handling photo/video uploads: ' . $e->getMessage());
        }

        // Handle video uploads
        try {
            if ($request->hasFile('video')) {
                foreach ($request->file('video') as $video) {
                    try {
                        $path = $video->store('report-videos', 'public');
                        if (!$path) {
                            \Log::error('Failed to store video: ' . $video->getClientOriginalName());
                            continue;
                        }
                        
                        ReportAsset::create([
                            'report_id' => $report->id,
                            'file_path' => $path,
                            'file_name' => $video->getClientOriginalName(),
                            'file_type' => 'video',
                            'mime_type' => $video->getClientMimeType(),
                            'file_size' => $video->getSize(),
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Error uploading video: ' . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error handling video uploads: ' . $e->getMessage());
        }

        $message = auth()->check() 
            ? 'Keluhan berhasil dikirim! Terima kasih atas laporan Anda.'
            : 'Keluhan berhasil dikirim! ' . 
              ($validated['is_public'] 
                ? 'Keluhan Anda dapat dilihat di halaman pesan utama.' 
                : 'Untuk melacak status keluhan pribadi, gunakan fitur "Lacak Pesan Pribadi" dengan email dan nomor telepon Anda.');

        return redirect()->back()->with('success', $message);
    }
}


