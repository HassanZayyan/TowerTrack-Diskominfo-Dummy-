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
            'sender_name' => 'required|string|max:100', // Tambahkan validasi untuk nama pengirim
            'assets.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi|max:20480', // 20MB max
        ]);

        // Gabungkan nama pengirim dengan kategori untuk disimpan tanpa migrasi baru
        $categoryWithName = $validated['category'] . ' [Dari: ' . $validated['sender_name'] . ']';

        $feedback = Feedback::create([
            'tower_id' => $validated['tower_id'],
            'user_id' => $request->user()->id,
            'sender_phone' => $validated['sender_phone'],
            'category' => $categoryWithName, // Simpan kategori beserta nama pengirim
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        // Handle file uploads
        if ($request->hasFile('assets')) {
            foreach ($request->file('assets') as $file) {
                $path = $file->store('feedback-assets', 'public');
                $fileType = str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'video';
                
                FeedbackAsset::create([
                    'feedback_id' => $feedback->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $fileType,
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'Masukan berhasil dikirim! Terima kasih atas masukan Anda.');
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
