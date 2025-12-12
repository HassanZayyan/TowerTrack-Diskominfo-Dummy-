<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
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
     * Allows authenticated users to view their own private messages.
     */
    protected function validatePublicAccess($model, string $type = 'Pesan'): void
    {
        if (!$model->is_public) {
            $user = auth()->user();
            // Allow authenticated users to view their own private messages
            if ($user && $model->user_id && (int) $model->user_id === (int) $user->id) {
                return;
            }
            // Not public and not owned by authenticated user - deny access
            abort(404, "{$type} tidak ditemukan atau tidak publik.");
        }
    }
    
    /**
     * Validate private access.
     * Requires authentication - only authenticated users can access private messages.
     */
    protected function validatePrivateAccess($model, Request $request, string $phoneField): void
    {
        if ($model->is_public) {
            abort(404, 'Pesan tidak ditemukan atau tidak pribadi.');
        }
        
        // Require authentication
        if (!auth()->check()) {
            abort(403, 'Anda harus login untuk mengakses pesan pribadi.');
        }
        
        $user = auth()->user();
        
        // Check if user owns the message or is staff/admin
        $isOwner = $model->user_id && $model->user_id === $user->id;
        $isStaff = in_array($user->role, ['admin', 'operator', 'tower_owner', 'provider_owner', 'staff']);
        
        if (!$isOwner && !$isStaff) {
            abort(403, 'Anda tidak memiliki akses ke pesan ini.');
        }
    }
    
    /**
     * Load common relationships for public messages.
     * Returns paginated comments separately to avoid redundancy.
     */
    protected function loadPublicRelationships($model, array $config): array
    {
        // Determine the polymorphic relationship name based on model type
        $polymorphicRelation = $model instanceof \App\Models\Report ? 'reportable' : 'feedbackable';
        
        // Load polymorphic relationship without select() to avoid SQL errors
        // Different models (Tower vs FoPoint) have different columns
        $relationships = [
            $polymorphicRelation, // Load all columns to avoid SQL errors
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
        
        // Count all comments including replies
        $commentCount = PublicComment::where('commentable_type', get_class($model))
            ->where('commentable_id', $model->id)
            ->where('is_approved', true)
            ->count();

        return [
            'comments' => $comments,
            'commentCount' => $commentCount,
        ];
    }
    
    /**
     * Load common relationships for private messages.
     */
    protected function loadPrivateRelationships($model, array $config): void
    {
        // Determine the polymorphic relationship name based on model type
        $polymorphicRelation = $model instanceof \App\Models\Report ? 'reportable' : 'feedbackable';
        
        // Load polymorphic relationship without select() to avoid SQL errors
        // Different models (Tower vs FoPoint) have different columns
        $relationships = [
            $polymorphicRelation, // Load all columns to avoid SQL errors
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
     * 
     * @param bool $isPublicContext Whether this is called from public page (true) or admin page (false)
     */
    protected function handleResponseSubmission(StoreMessageResponseRequest $request, $model, array $config, bool $isPublicContext = false): RedirectResponse
    {
        $validated = $request->validated();
        $senderContext = $this->resolveSenderContext($request, $model, $config, $isPublicContext);

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
     * @param  bool  $isPublicContext Whether this is called from public page (true) or admin page (false)
     * @return array<string, mixed>
     */
    protected function resolveSenderContext(Request $request, $model, array $config, bool $isPublicContext = false): array
    {
        $user = $request->user();

        if ($user) {
            $isReporter = (int) $model->user_id === (int) $user->id;
            $isAdmin = method_exists($user, 'isAdmin') && $user->isAdmin();
            $isOperator = $user->role === 'operator';
            $isAdminOrOperator = $isAdmin || $isOperator;
            
            // Prevent admin/operator from creating official responses from public pages
            // They should use admin pages for official responses (with email notifications and status updates)
            if ($isPublicContext && $isAdminOrOperator) {
                $messageType = $model instanceof \App\Models\Report ? 'laporan' : 'masukan';
                $adminRoute = $model instanceof \App\Models\Report 
                    ? route('admin.complaints.show', $model)
                    : route('admin.feedbacks.show', $model);
                
                abort(403, "Admin dan operator tidak dapat membalas pesan resmi dari halaman publik. Silakan gunakan halaman admin untuk membalas {$messageType} ini: {$adminRoute}");
            }
            
            // Admin can always reply (from admin pages)
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
            
            // For anonymous reports, only admin and operator can reply
            // Tower owner cannot reply to anonymous reports (same as complainant)
            if ($isOperator) {
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
            throw ValidationException::withMessages([
                'email' => 'Email diperlukan untuk membalas pesan ini.'
            ]);
        }

        if ($requiresPhone && $providedPhone === '') {
            throw ValidationException::withMessages([
                'phone' => 'Nomor telepon diperlukan untuk membalas pesan ini.'
            ]);
        }

        if ($requiresEmail && !hash_equals($storedEmail, $providedEmail)) {
            throw ValidationException::withMessages([
                'email' => 'Email tidak cocok dengan data pengirim.'
            ]);
        }

        if ($requiresPhone && !hash_equals($storedPhone, $providedPhone)) {
            throw ValidationException::withMessages([
                'phone' => 'Nomor telepon tidak cocok dengan data pengirim.'
            ]);
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
            $user = auth()->user();
            
            // For authenticated users who should auto-fill (complainant, tower_owner, provider_owner)
            // use their email automatically
            if ($user->shouldAutoFillContactInfo()) {
                $email = $user->email;
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
     * Validate that private messages can only be created by authenticated users.
     * 
     * @param array $validated Validated request data
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function validatePrivateMessageAccess(array $validated): void
    {
        // Check if user is trying to create a private message
        $isPrivate = !($validated['is_public'] ?? true);
        
        if ($isPrivate && isGuest()) {
            abort(403, 'Pesan private hanya tersedia untuk pengguna yang sudah login. Silakan daftar atau login terlebih dahulu.');
        }
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

                // Use ImageOptimizationService for images, regular store for videos
                if ($isImage) {
                    $path = \App\Services\ImageOptimizationService::optimizeAndStore(
                        $file,
                        $directory,
                        $disk
                    );
                } else {
                    $path = $file->store($directory, $disk);
                }

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