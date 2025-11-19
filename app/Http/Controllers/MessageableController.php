<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\HasStatusHandling;
use App\Models\PublicComment;
use App\Http\Requests\StoreMessageResponseRequest;
use App\Services\MessageResponseService;

/**
 * Base controller for messageable models (Report and Feedback).
 * Provides shared logic to avoid code duplication.
 */
abstract class MessageableController extends Controller
{
    use HasStatusHandling;
    
    protected MessageResponseService $messageResponseService;

    public function __construct(MessageResponseService $messageResponseService)
    {
        $this->messageResponseService = $messageResponseService;
    }
    
    /**
     * Configuration for different messageable types.
     * Override in child controllers.
     */
    abstract protected function getConfig(): array;
    
    /**
     * Validate public access.
     */
    protected function validatePublicAccess($model, string $type = 'Pesan'): void
    {
        if (!$model->is_public) {
            abort(404, "{$type} tidak ditemukan atau tidak publik.");
        }
    }
    
    /**
     * Validate private access.
     * 
     * @return array [email, phone]
     */
    protected function validatePrivateAccess($model, Request $request, string $phoneField): array
    {
        $email = $request->query('email');
        $phone = $request->query('phone');
        
        if ($model->is_public) {
            abort(404, 'Pesan tidak ditemukan atau tidak pribadi.');
        }
        
        if (!$email || !$phone) {
            abort(404, 'Email dan nomor telepon diperlukan untuk mengakses pesan pribadi.');
        }
        
        if ($model->email !== $email || $model->$phoneField !== $phone) {
            abort(403, 'Anda tidak memiliki akses ke pesan ini.');
        }

        // For guest users (no user_id), require email verification
        if (!$model->user_id && method_exists($model, 'hasVerifiedEmail') && !$model->hasVerifiedEmail()) {
            abort(403, 'Email Anda belum diverifikasi. Silakan periksa email Anda dan klik link verifikasi yang telah dikirim, atau gunakan fitur "Kirim Ulang Verifikasi Email" untuk mendapatkan link baru.');
        }
        
        return [$email, $phone];
    }
    
    /**
     * Load common relationships for public messages.
     * Returns paginated comments separately to avoid redundancy.
     */
    protected function loadPublicRelationships($model, array $config): LengthAwarePaginator
    {
        $relationships = [
            'tower:id,site_name,alamat_menara',
            'user:id,name,email,role',
            $config['assets_relation'] => function($q) use ($config) {
                $q->select($config['assets_select']);
            },
            'responses' => function($q) use ($config) {
                $q->select($config['responses_select'])
                  ->with(['user:id,name', $config['response_assets_relation']]);
            }
        ];
        
        $model->load($relationships);
        
        // Load paginated comments separately to avoid redundancy
        $comments = PublicComment::where('commentable_type', get_class($model))
            ->where('commentable_id', $model->id)
            ->whereNull('parent_id')
            ->where('is_approved', true)
            ->with(['user:id,name,email', 'replies' => function($replyQ) {
                $replyQ->where('is_approved', true)
                      ->orderBy('created_at', 'asc')
                      ->with(PublicComment::buildNestedRepliesEagerLoad(3));
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        return $comments;
    }
    
    /**
     * Load common relationships for private messages.
     */
    protected function loadPrivateRelationships($model, array $config): void
    {
        $relationships = [
            'tower:id,site_name,alamat_menara',
            'user:id,name,email,role',
            $config['assets_relation'] => function($q) use ($config) {
                $q->select($config['assets_select']);
            },
            'responses' => function($q) use ($config) {
                $q->select($config['responses_select'])
                  ->with(['user:id,name', $config['response_assets_relation']]);
            }
        ];
        
        $model->load($relationships);
    }

    /**
     * Handle storing of responses for a messageable model.
     */
    protected function handleResponseSubmission(StoreMessageResponseRequest $request, $model, array $config): RedirectResponse
    {
        $validated = $request->validated();
        $senderContext = $this->resolveSenderContext($request, $model, $config);

        $payload = array_merge($senderContext, [
            'message' => $validated['message'],
            'attachments' => $request->file('attachments', []),
        ]);

        $this->messageResponseService->createResponse($model, $payload, $config);

        return back()->with('success', 'Balasan berhasil dikirim.');
    }

    /**
     * Resolve the sender information for the response.
     *
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    protected function resolveSenderContext(Request $request, $model, array $config): array
    {
        $user = $request->user();

        if ($user) {
            $isReporter = (int) $model->user_id === (int) $user->id;
            $isAdmin = method_exists($user, 'isAdmin') && $user->isAdmin();
            
            // Admin can always reply
            if ($isAdmin) {
                return [
                    'user_id' => $user->id,
                    'sender_type' => 'staff',
                    'sender_name' => $user->name,
                    'sender_email' => $user->email,
                    'sender_phone' => null,
                ];
            }
            
            // Reporter can always reply to their own report
            if ($isReporter) {
                return [
                    'user_id' => $user->id,
                    'sender_type' => 'reporter',
                    'sender_name' => $user->name,
                    'sender_email' => $user->email,
                    'sender_phone' => $model->{$config['phone_field']} ?? null,
                ];
            }
            
            // For authenticated reports, only admin and reporter can reply
            // (already checked above: admin at line 160, reporter at line 171)
            if ($model->user_id) {
                abort(403, 'Anda tidak memiliki akses untuk membalas pesan ini.');
            }
            
            // For anonymous reports, staff can reply
            if (method_exists($user, 'isStaff') && $user->isStaff()) {
                return [
                    'user_id' => $user->id,
                    'sender_type' => 'staff',
                    'sender_name' => $user->name,
                    'sender_email' => $user->email,
                    'sender_phone' => null,
                ];
            }

            abort(403, 'Anda tidak memiliki akses untuk membalas pesan ini.');
        }

        // Guest users can only reply to anonymous reports (no authenticated reporter)
        if ($model->user_id) {
            abort(403, 'Laporan ini dibuat oleh pengguna terautentikasi. Silakan login dengan akun Anda untuk membalas.');
        }

        $emailField = $config['email_field'] ?? 'email';
        $nameField = $config['name_field'] ?? 'name';
        $phoneField = $config['phone_field'] ?? 'phone';

        $storedEmail = $emailField ? (string) ($model->{$emailField} ?? '') : '';
        $storedPhone = $phoneField ? (string) ($model->{$phoneField} ?? '') : '';

        $requiresEmail = $emailField && $storedEmail !== '';
        $requiresPhone = $phoneField && $storedPhone !== '';

        $providedEmail = (string) $request->input('email', '');
        $providedPhone = (string) $request->input('phone', '');

        if ($requiresEmail && $providedEmail === '') {
            abort(403, 'Email diperlukan untuk membalas pesan ini.');
        }

        if ($requiresPhone && $providedPhone === '') {
            abort(403, 'Nomor telepon diperlukan untuk membalas pesan ini.');
        }

        if ($requiresEmail && !hash_equals($storedEmail, $providedEmail)) {
            abort(403, 'Email tidak cocok dengan data pengirim.');
        }

        if ($requiresPhone && !hash_equals($storedPhone, $providedPhone)) {
            abort(403, 'Anda tidak memiliki akses ke pesan ini.');
        }

        $fallbackName = $model->{$nameField} ?? null;

        return [
            'user_id' => null,
            'sender_type' => 'guest',
            'sender_name' => $request->input('sender_name') ?: $fallbackName,
            'sender_email' => $requiresEmail ? $providedEmail : null,
            'sender_phone' => $requiresPhone ? $providedPhone : null,
        ];
    }

    /**
     * Determine whether the incoming request contains any primary attachments.
     */
    protected function hasInitialAttachments(Request $request, array $config = []): bool
    {
        $fields = $config['asset_fields'] ?? ['foto', 'assets', 'video'];

        foreach ($fields as $field) {
            if ($request->hasFile($field)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve user ID and email based on authentication status.
     * 
     * @param array $validated Validated request data
     * @return array [userId, email]
     */
    protected function resolveUserAndEmail(array $validated): array
    {
        $userId = null;
        $email = null;
        
        if (isAuthenticated()) {
            $userId = auth()->id();
            // For authenticated users (complainant and tower_owner), use their email automatically
            if (auth()->user()->isComplainant() || auth()->user()->isTowerOwner()) {
                $email = auth()->user()->email;
            }
        } else {
            // For anonymous users, email is required
            $email = $validated['email'] ?? null;
        }
        
        return [$userId, $email];
    }

    /**
     * Validate and verify CAPTCHA for guest users.
     * 
     * @param array $validated Validated request data
     * @param string $ipAddress Client IP address
     * @return RedirectResponse|null Returns redirect response if CAPTCHA fails, null otherwise
     */
    protected function validateCaptchaForGuest(array $validated, string $ipAddress): ?RedirectResponse
    {
        if (!isGuest()) {
            return null;
        }

        $captchaService = app(\App\Services\CaptchaService::class);
        if (!$captchaService->verify(
            $validated['cf-turnstile-response'] ?? '',
            $ipAddress
        )) {
            return back()->withErrors([
                'captcha' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.'
            ])->withInput();
        }

        return null;
    }

    /**
     * Add CAPTCHA validation rule for guest users.
     * 
     * @param array $rules Existing validation rules
     * @return array Updated validation rules
     */
    protected function addCaptchaRuleForGuest(array $rules): array
    {
        if (isGuest()) {
            $rules['cf-turnstile-response'] = 'required|string';
        }
        
        return $rules;
    }

    /**
     * Send email verification for guest users and handle redirect.
     * 
     * @param mixed $model The messageable model (Report or Feedback)
     * @param string|null $email The email address to verify
     * @param string $type The message type ('complaint' or 'feedback')
     * @return RedirectResponse|null Returns redirect response if guest user, null otherwise
     */
    protected function sendGuestEmailVerification($model, ?string $email, string $type): ?RedirectResponse
    {
        // Only send verification for guest users (not authenticated)
        if (isGuest() && $email) {
            // Check if email has been verified before (for any previous submission)
            if (\App\Models\GuestEmailVerification::isEmailVerified($email)) {
                // Email already verified before, mark this model as verified and skip sending email
                if (method_exists($model, 'markEmailAsVerified')) {
                    $model->markEmailAsVerified();
                }
                // Return null to continue with normal flow (no redirect to verification page)
                return null;
            }
            
            // Email not verified before, create new verification token and send email
            try {
                $verification = \App\Models\GuestEmailVerification::createFor($model, $email);
                \Mail::to($email)->send(
                    new \App\Mail\GuestEmailVerificationMail($verification, $type)
                );
                
                // Redirect guest to verification notice page
                return redirect()->route('guest.verification.notice', [
                    'email' => $email,
                    'type' => $type
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send guest email verification', [
                    'error' => $e->getMessage(),
                    'model_id' => $model->id,
                    'model_type' => get_class($model),
                    'email' => $email,
                ]);
                // Continue anyway - don't block the submission
            }
        }
        
        return null;
    }

    /**
     * Persist primary attachments for the given messageable model.
     *
     * @param  array<string, mixed>  $config
     */
    protected function storeInitialAttachments(Request $request, int $messageId, array $config): void
    {
        $modelClass = $config['asset_model'] ?? null;
        $foreignKey = $config['asset_foreign_key'] ?? null;

        if (!$modelClass || !$foreignKey || !class_exists($modelClass)) {
            return;
        }

        $disk = $config['asset_disk'] ?? 'public';
        $directories = $config['asset_directories'] ?? [];
        $fields = $config['asset_fields'] ?? ['foto', 'assets', 'video'];

        $files = collect();
        foreach ($fields as $field) {
            if ($request->hasFile($field)) {
                $fieldFiles = $request->file($field);
                $files = $files->merge(is_array($fieldFiles) ? $fieldFiles : [$fieldFiles]);
            }
        }

        $files->filter()->each(function ($file) use ($modelClass, $foreignKey, $messageId, $directories, $disk) {
            try {
                $mimeType = method_exists($file, 'getClientMimeType')
                    ? $file->getClientMimeType()
                    : $file->getMimeType();

                $isImage = str_starts_with($mimeType ?? '', 'image/');
                $directory = $isImage
                    ? ($directories['image'] ?? 'message-assets/images')
                    : ($directories['video'] ?? 'message-assets/videos');

                $path = $file->store($directory, $disk);

                if (!$path) {
                    return;
                }

                $modelClass::create([
                    $foreignKey => $messageId,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $isImage ? 'image' : 'video',
                    'mime_type' => $mimeType,
                    'file_size' => $file->getSize(),
                ]);
            } catch (\Throwable $exception) {
                \Log::error(sprintf(
                    'Failed storing message attachment for %s: %s',
                    $modelClass,
                    $exception->getMessage()
                ));
            }
        });
    }
}