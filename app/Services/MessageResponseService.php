<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;

class MessageResponseService
{
    /**
     * Create a response record for a messageable model.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $messageable
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $config
     */
    public function createResponse(Model $messageable, array $payload, array $config): Model
    {
        $responseClass = $config['response_model'] ?? null;
        $foreignKey = $config['response_foreign_key'] ?? null;

        if (!$responseClass || !$foreignKey) {
            throw new \InvalidArgumentException('Response configuration is invalid.');
        }

        $data = [
            $foreignKey => $messageable->getKey(),
            'message' => $payload['message'],
            'user_id' => $payload['user_id'] ?? null,
            'sender_type' => $payload['sender_type'] ?? 'reporter',
            'sender_name' => $payload['sender_name'] ?? null,
            'sender_email' => $payload['sender_email'] ?? null,
            'sender_phone' => $payload['sender_phone'] ?? null,
        ];

        $response = $responseClass::create($data);

        if (!empty($payload['status_id']) && method_exists($response, 'setStatus')) {
            $response->setStatus($payload['status_id']);
        }

        if (!empty($payload['attachments']) && is_iterable($payload['attachments'])) {
            $this->storeAttachments($response, $payload['attachments'], $config);
        }

        return $response;
    }

    /**
     * Store uploaded attachments for the response.
     *
     * @param  \Illuminate\Database\Eloquent\Model  $response
     * @param  iterable<int, UploadedFile>  $attachments
     * @param  array<string, mixed>  $config
     */
    protected function storeAttachments(Model $response, iterable $attachments, array $config): void
    {
        $relationName = $config['response_assets_relation_name'] ?? null;
        if (!$relationName || !method_exists($response, $relationName)) {
            return;
        }

        $disk = $config['response_attachment_disk'] ?? 'public';
        $directories = $config['response_attachment_directories'] ?? [];

        foreach ($attachments as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $mimeType = $file->getClientMimeType();
            $isImage = str_starts_with($mimeType, 'image/');
            $directory = $isImage
                ? ($directories['image'] ?? 'message-responses/images')
                : ($directories['video'] ?? 'message-responses/files');

            $path = $file->store($directory, $disk);

            if (!$path) {
                continue;
            }

            $response->{$relationName}()->create([
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $isImage ? 'image' : 'video',
                'mime_type' => $mimeType,
                'file_size' => $file->getSize(),
            ]);
        }
    }
}