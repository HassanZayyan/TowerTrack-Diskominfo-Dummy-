<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TowerController extends Controller
{
    public function index(Request $request)
    {
        $towers = Tower::query()
            ->orderBy('site_name')
            ->paginate(20);

        return Inertia::render('Admin/Towers', [
            'towers' => $towers,
        ]);
    }

    public function update(Request $request, Tower $tower)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'tinggi_menara' => 'nullable|numeric|min:0',
            'alamat_menara' => 'nullable|string|max:1000',
            'site_type' => 'nullable|string|max:255',
            'status_ijin' => 'nullable|string|max:255',
        ]);

        $tower->update($validated);
        return back();
    }
}


