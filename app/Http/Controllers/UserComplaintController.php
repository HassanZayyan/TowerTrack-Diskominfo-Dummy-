<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportAsset;
use App\Models\Tower;
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
     * Store complaint submitted by authenticated user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'nullable|string|max:255',
            'telepon' => 'required|string|max:20',
            'kategori' => 'required|string|max:100',
            'lokasi_tower' => 'required|string|max:255',
            'tower_id' => 'required|exists:towers,id',
            'pesan' => 'required|string|max:500',
            'foto.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'video.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:51200',
        ]);

        // Get default pending status ID
        $pendingStatusId = null;
        try {
            $pendingStatus = \App\Models\Status::where('slug', 'pending')->first();
            $pendingStatusId = $pendingStatus ? $pendingStatus->id : null;
        } catch (\Exception $e) {
            // If status table doesn't exist, continue without setting status_id
        }
        
        $report = Report::create([
            'tower_id' => $validated['tower_id'],
            'user_id' => $request->user()->id,
            'reporter_name' => $validated['nama'] ?? $request->user()->name,
            'reporter_phone' => $validated['telepon'],
            'category' => $validated['kategori'],
            'message' => $validated['pesan'],
            'status_id' => $pendingStatusId,
        ]);

        // Handle image uploads
        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $photo) {
                $path = $photo->store('report-photos', 'public');
                ReportAsset::create([
                    'report_id' => $report->id,
                    'file_path' => $path,
                    'file_name' => $photo->getClientOriginalName(),
                    'file_type' => 'image',
                    'mime_type' => $photo->getClientMimeType(),
                    'file_size' => $photo->getSize(),
                ]);
            }
        }

        // Handle video uploads
        if ($request->hasFile('video')) {
            foreach ($request->file('video') as $video) {
                $path = $video->store('report-videos', 'public');
                ReportAsset::create([
                    'report_id' => $report->id,
                    'file_path' => $path,
                    'file_name' => $video->getClientOriginalName(),
                    'file_type' => 'video',
                    'mime_type' => $video->getClientMimeType(),
                    'file_size' => $video->getSize(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'Keluhan berhasil dikirim');
    }
}


