<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportImage;
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
            ->select(['id', 'site_name', 'alamat_menara'])
            ->orderBy('site_name')
            ->get()
            ->toArray();

        return Inertia::render('Complaint', [
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
        ]);

        $report = Report::create([
            'tower_id' => $validated['tower_id'],
            'user_id' => $request->user()->id,
            'reporter_phone' => $validated['telepon'],
            'category' => $validated['kategori'],
            'message' => $validated['pesan'],
            'status' => 'pending',
        ]);

        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $photo) {
                $path = $photo->store('report-photos', 'public');
                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $path,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Keluhan berhasil dikirim');
    }
}


