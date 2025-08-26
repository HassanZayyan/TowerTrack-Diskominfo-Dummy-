<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\FeedbackAsset;
use App\Models\Tower;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
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
            'sender_phone' => 'required|string|max:20',
            'category' => 'required|string|max:100',
            'tower_id' => 'required|exists:towers,id',
            'message' => 'required|string|max:1000',
            'sender_name' => 'required|string|max:100',
            'email' => auth()->check() && auth()->user()->isComplainant() 
                ? 'prohibited' // Email not allowed for authenticated complainant users
                : 'nullable|email|max:255', // Email required for anonymous users
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
            // For authenticated complainant users, use their email automatically
            if (auth()->user()->isComplainant()) {
                $email = auth()->user()->email;
            }
        } else {
            // For anonymous users, email is required
            $email = $validated['email'];
        }

        $feedback = Feedback::create([
            'tower_id' => $validated['tower_id'],
            'user_id' => $userId,
            'email' => $email,
            'sender_phone' => $validated['sender_phone'],
            'sender_name' => $validated['sender_name'],
            'category' => $validated['category'],
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        // Handle file uploads from any accepted key: assets, foto, or video
        $files = collect();
        if ($request->hasFile('assets')) {
            $files = $files->merge($request->file('assets'));
        }
        if ($request->hasFile('foto')) {
            $files = $files->merge($request->file('foto'));
        }
        if ($request->hasFile('video')) {
            $files = $files->merge($request->file('video'));
        }

        foreach ($files as $file) {
            try {
                $mime = $file->getMimeType();
                $isImage = str_starts_with($mime, 'image/');
                $dir = $isImage ? 'feedback-photos' : 'feedback-videos';
                $path = $file->store($dir, 'public');
                if (!$path) {
                    \Log::error('Failed to store feedback asset: ' . $file->getClientOriginalName());
                    continue;
                }

                FeedbackAsset::create([
                    'feedback_id' => $feedback->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $isImage ? 'image' : 'video',
                    'mime_type' => $mime,
                    'file_size' => $file->getSize(),
                ]);
            } catch (\Exception $e) {
                \Log::error('Error uploading feedback asset: ' . $e->getMessage());
                continue;
            }
        }

        $message = auth()->check() 
            ? 'Masukan berhasil dikirim! Terima kasih atas masukan Anda.'
            : 'Masukan berhasil dikirim! Gunakan email Anda untuk melihat status dan respons.';

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
}
