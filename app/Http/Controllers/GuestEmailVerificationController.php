<?php

namespace App\Http\Controllers;

use App\Models\GuestEmailVerification;
use App\Models\Feedback;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GuestEmailVerificationController extends Controller
{
    /**
     * Get model configuration based on type.
     * 
     * @param string $type 'feedback' or 'report'
     * @return array
     */
    protected function getModelConfig(string $type): array
    {
        return [
            'model' => $type === 'feedback' ? Feedback::class : Report::class,
            'phone_field' => $type === 'feedback' ? 'sender_phone' : 'reporter_phone',
            'message_type' => $type === 'feedback' ? 'feedback' : 'complaint',
            'route' => $type === 'feedback' ? 'feedback' : 'complaint',
        ];
    }

    /**
     * Get message type from model instance.
     * 
     * @param mixed $model
     * @return string 'complaint' or 'feedback'
     */
    protected function getMessageTypeFromModel($model): string
    {
        return $model instanceof Report ? 'complaint' : 'feedback';
    }

    /**
     * Get success message based on message type.
     * 
     * @param string $messageType 'complaint' or 'feedback'
     * @return string
     */
    protected function getSuccessMessage(string $messageType): string
    {
        return $messageType === 'complaint'
            ? 'Email Anda berhasil diverifikasi! Keluhan Anda telah berhasil dikirimkan.'
            : 'Email Anda berhasil diverifikasi! Masukan Anda telah berhasil dikirimkan.';
    }

    /**
     * Show the guest email verification notice page.
     */
    public function notice(Request $request): Response
    {
        $email = $request->query('email');
        $type = $request->query('type', 'feedback');
        
        return Inertia::render('Guest/VerifyEmail', [
            'email' => $email,
            'type' => $type,
            'status' => session('status'),
        ]);
    }

    /**
     * Verify guest email using token.
     */
    public function verify(string $token): RedirectResponse
    {
        $verification = GuestEmailVerification::verifyToken($token);

        if (!$verification) {
            return redirect()->route('data.tower')->with('error', 
                'Link verifikasi tidak valid atau sudah kedaluwarsa. Silakan hubungi administrator untuk mendapatkan link verifikasi baru.'
            );
        }

        $model = $verification->verifiable;
        $messageType = $this->getMessageTypeFromModel($model);
        
        // Redirect ke halaman success setelah verifikasi
        return redirect()->route('guest.submission.success', [
            'type' => $messageType
        ]);
    }

    /**
     * Resend verification email.
     */
    public function resend(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'phone' => 'required|string',
            'type' => 'required|in:feedback,report',
            'id' => 'required|integer',
        ]);

        $config = $this->getModelConfig($request->type);
        $model = $config['model']::findOrFail($request->id);

        // Verify email and phone match
        if ($model->email !== $request->email || $model->{$config['phone_field']} !== $request->phone) {
            return back()->withErrors([
                'email' => 'Email atau nomor telepon tidak cocok dengan data yang tersimpan.'
            ]);
        }

        // Check if already verified
        if ($model->email_verified_at) {
            return back()->with('info', 'Email Anda sudah terverifikasi.');
        }

        // Create new verification token and send email
        $verification = GuestEmailVerification::createFor($model, $request->email);
        \Mail::to($request->email)->send(
            new \App\Mail\GuestEmailVerificationMail($verification, $config['message_type'])
        );

        return back()->with('success', 
            'Email verifikasi telah dikirim ulang ke ' . $request->email . '. Silakan periksa inbox Anda.'
        );
    }
}
