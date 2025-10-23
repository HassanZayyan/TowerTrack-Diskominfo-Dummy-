<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreComplaintRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama' => 'nullable|string|max:255',
            'telepon' => 'required|string|regex:/^[0-9+\-\s()]+$/|max:20',
            'kategori' => 'required|string|in:interference,maintenance,safety,other',
            'lokasi_tower' => 'required|string|max:255',
            'tower_id' => 'required|exists:towers,id',
            'pesan' => 'required|string|min:10|max:1000',
            'email' => auth()->check() && auth()->user()->isComplainant() 
                ? 'prohibited' 
                : 'required|email|max:255',
            'is_public' => 'required|boolean',
            'reporter_latitude' => 'nullable|numeric|between:-90,90',
            'reporter_longitude' => 'nullable|numeric|between:-180,180',
            'reporter_accuracy' => 'nullable|numeric|min:0|max:10000',
            'foto.*' => 'nullable|file|mimes:jpeg,png,jpg|max:10240',
            'video.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:102400',
            'assets.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4,mov,avi,mkv|max:102400',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'telepon.regex' => 'Format nomor telepon tidak valid. Hanya angka, +, -, spasi, dan tanda kurung yang diperbolehkan.',
            'kategori.in' => 'Kategori yang dipilih tidak valid. Pilih: interference, maintenance, safety, atau other.',
            'pesan.min' => 'Pesan minimal 10 karakter.',
            'pesan.max' => 'Pesan maksimal 1000 karakter.',
            'reporter_latitude.between' => 'Koordinat latitude harus antara -90 dan 90.',
            'reporter_longitude.between' => 'Koordinat longitude harus antara -180 dan 180.',
            'reporter_accuracy.min' => 'Akurasi lokasi tidak boleh negatif.',
            'reporter_accuracy.max' => 'Akurasi lokasi maksimal 10000 meter.',
            'foto.*.mimes' => 'Foto harus berformat JPEG, PNG, atau JPG.',
            'foto.*.max' => 'Ukuran foto maksimal 10MB.',
            'video.*.mimes' => 'Video harus berformat MP4, MOV, AVI, atau MKV.',
            'video.*.max' => 'Ukuran video maksimal 100MB.',
            'assets.*.mimes' => 'File harus berformat JPEG, PNG, JPG, MP4, MOV, AVI, atau MKV.',
            'assets.*.max' => 'Ukuran file maksimal 100MB.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nama' => 'nama pelapor',
            'telepon' => 'nomor telepon',
            'kategori' => 'kategori keluhan',
            'lokasi_tower' => 'lokasi tower',
            'tower_id' => 'tower',
            'pesan' => 'pesan keluhan',
            'email' => 'alamat email',
            'is_public' => 'visibilitas keluhan',
            'reporter_latitude' => 'latitude pelapor',
            'reporter_longitude' => 'longitude pelapor',
            'reporter_accuracy' => 'akurasi lokasi',
            'foto.*' => 'foto',
            'video.*' => 'video',
            'assets.*' => 'file lampiran',
        ];
    }
}
