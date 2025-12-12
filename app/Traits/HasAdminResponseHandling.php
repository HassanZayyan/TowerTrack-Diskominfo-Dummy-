<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\AdminReplyNotificationMail;

/**
 * Trait for handling admin responses to reports and feedbacks.
 * Provides DRY methods for creating responses with attachments and updating status.
 */
trait HasAdminResponseHandling
{
    /**
     * Create admin response with attachments and update status.
     * 
     * @param Request $request
     * @param mixed $model Report or Feedback model
     * @param array $config Configuration array
     * @return mixed Response model or null
     */
    protected function createAdminResponse(Request $request, $model, array $config)
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:1000',
            'status_id' => 'required',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'videos.*' => 'nullable|file|mimes:mp4,mov,avi,mkv|max:51200',
        ]);

        $response = null;
        
        try {
            // Create response only if there's a message
            if (!empty($validated['message'])) {
                $response = $this->createResponseRecord($request, $model, $validated['message'], $config);
                
                // Send email notification to the sender after response is created
                if ($response) {
                    $this->sendAdminReplyNotification($model, $response);
                }
            }
            
            // Process attachments
            if ($response) {
                $this->processResponseAttachments($request, $response, $config);
            }
            
            // Update status
            $this->updateModelStatus($model, $validated['status_id'], $config);
            
        } catch (\Exception $e) {
            Log::error('Error creating admin response: ' . $e->getMessage(), [
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'error' => $e->getMessage(),
            ]);
            
            // Retry response creation if it failed
            if (!$response && !empty($validated['message'])) {
                $response = $this->createResponseRecord($request, $model, $validated['message'], $config);
                
                // Try to send email notification if response was created on retry
                if ($response) {
                    try {
                        $this->sendAdminReplyNotification($model, $response);
                    } catch (\Exception $emailException) {
                        Log::error('Failed to send admin reply notification email on retry', [
                            'error' => $emailException->getMessage(),
                            'model_id' => $model->id,
                        ]);
                    }
                }
            }
        }

        return $response;
    }

    /**
     * Create response record.
     * 
     * @param Request $request
     * @param mixed $model
     * @param string $message
     * @param array $config
     * @return mixed
     */
    protected function createResponseRecord(Request $request, $model, string $message, array $config)
    {
        $responseClass = $config['response_model'];
        $foreignKey = $config['response_foreign_key'];
        $user = $request->user();

        return $responseClass::create([
            $foreignKey => $model->id,
            'user_id' => $user->id,
            'sender_type' => 'staff',
            'sender_name' => $user->name,
            'sender_email' => $user->email,
            'message' => $message,
        ]);
    }

    /**
     * Process response attachments (images and videos).
     * 
     * @param Request $request
     * @param mixed $response
     * @param array $config
     * @return void
     */
    protected function processResponseAttachments(Request $request, $response, array $config)
    {
        $assetModel = $config['response_asset_model'] ?? null;
        $assetForeignKey = $config['response_asset_foreign_key'] ?? null;
        $imageDirectory = $config['response_image_directory'] ?? 'admin-response-photos';
        $videoDirectory = $config['response_video_directory'] ?? 'admin-response-videos';

        // Process images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $this->storeResponseAttachment($response, $image, 'image', $imageDirectory, $assetModel, $assetForeignKey);
            }
        }

        // Process videos
        if ($request->hasFile('videos')) {
            foreach ($request->file('videos') as $video) {
                $this->storeResponseAttachment($response, $video, 'video', $videoDirectory, $assetModel, $assetForeignKey);
            }
        }
    }

    /**
     * Store single response attachment.
     * 
     * @param mixed $response
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $fileType
     * @param string $directory
     * @param string|null $assetModel
     * @param string|null $assetForeignKey
     * @return void
     */
    protected function storeResponseAttachment($response, $file, string $fileType, string $directory, ?string $assetModel, ?string $assetForeignKey)
    {
        $filePath = $file->store($directory, 'public');
        $mimeType = $file->getClientMimeType();

        $attachmentData = [
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $fileType,
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
        ];

        if ($assetModel && $assetForeignKey && class_exists($assetModel)) {
            // Use asset model directly (e.g., FeedbackResponseAsset)
            $assetModel::create(array_merge($attachmentData, [
                $assetForeignKey => $response->id,
            ]));
        } elseif (method_exists($response, 'assets')) {
            // Fallback to relationship if assets() method exists (e.g., ReportResponse)
            $response->assets()->create($attachmentData);
        } else {
            // Log warning if neither method works
            \Log::warning('Unable to store response attachment - no asset model or relationship found', [
                'response_type' => get_class($response),
                'asset_model' => $assetModel,
            ]);
        }
    }

    /**
     * Update model status (handles both Report and Feedback).
     * 
     * @param mixed $model
     * @param mixed $statusId
     * @param array $config
     * @return void
     */
    protected function updateModelStatus($model, $statusId, array $config)
    {
        // For Feedback, convert status_id to status string
        if ($model instanceof \App\Models\Feedback) {
            $statusMap = [
                '1' => 'pending',
                '2' => 'in_progress',
                '3' => 'closed'
            ];
            
            $statusValue = is_numeric($statusId) && isset($statusMap[$statusId]) 
                ? $statusMap[$statusId] 
                : $statusId;
            
            $model->update(['status' => $statusValue]);
        } else {
            // For Report, use status_id directly
            $model->update(['status_id' => $statusId]);
        }
    }

    /**
     * Send email notification to the sender when admin replies.
     * 
     * @param mixed $model Report or Feedback model
     * @param mixed $response ReportResponse or FeedbackResponse model
     * @return void
     */
    protected function sendAdminReplyNotification($model, $response)
    {
        // Only send if response is from staff/admin
        if (!$this->isStaffResponse($response)) {
            return;
        }

        // Get email address and verify eligibility
        $emailAddress = $this->getSenderEmail($model);
        if (!$emailAddress) {
            Log::warning('Cannot send admin reply notification: no email address', [
                'model_type' => get_class($model),
                'model_id' => $model->id,
            ]);
            return;
        }

        // Check if email is verified (for guest users) or if user is authenticated
        if (!$this->isEmailEligibleForNotification($model)) {
            Log::info('Skipping admin reply notification: email not verified', [
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'email' => $emailAddress,
            ]);
            return;
        }

        try {
            $messageType = $this->getMessageType($model);
            
            Mail::to($emailAddress)->send(
                new AdminReplyNotificationMail($model, $response, $messageType)
            );

            Log::info('Admin reply notification email sent', [
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'email' => $emailAddress,
                'message_type' => $messageType,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send admin reply notification email', [
                'error' => $e->getMessage(),
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'email' => $emailAddress,
            ]);
            // Don't throw - email failure shouldn't break the response creation
        }
    }

    /**
     * Check if the response is from staff/admin.
     * 
     * @param mixed $response ReportResponse or FeedbackResponse
     * @return bool
     */
    protected function isStaffResponse($response): bool
    {
        return method_exists($response, 'isFromStaff') && $response->isFromStaff();
    }

    /**
     * Get the sender email address from the model.
     * 
     * @param mixed $model Report or Feedback model
     * @return string|null
     */
    protected function getSenderEmail($model): ?string
    {
        return $model->email ?? null;
    }

    /**
     * Check if email is eligible for notification.
     * Email must be verified (for guest users) or user must be authenticated.
     * 
     * @param mixed $model Report or Feedback model
     * @return bool
     */
    protected function isEmailEligibleForNotification($model): bool
    {
        // Authenticated users (user_id is not null) are always eligible
        if ($model->user_id !== null) {
            return true;
        }

        // Guest users must have verified their email
        return $model->email_verified_at !== null;
    }

    /**
     * Get the message type ('complaint' or 'feedback').
     * 
     * @param mixed $model Report or Feedback model
     * @return string
     */
    protected function getMessageType($model): string
    {
        return $model instanceof \App\Models\Report ? 'complaint' : 'feedback';
    }
}

