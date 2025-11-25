<?php

namespace App\Services;

use App\Models\Feedback;
use App\Models\Report;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PublicMessageQueryService
{
    /**
     * Retrieve public reports for the "My Messages" listing.
     */
    public function getPublicReports(bool $includeSenderDetails = true): Collection
    {
        $responseSelect = ['id', 'report_id', 'message', 'created_at', 'user_id'];

        if ($includeSenderDetails) {
            $responseSelect = array_merge($responseSelect, ['sender_type', 'sender_name', 'sender_email', 'sender_phone']);
        }

        return Report::with([
                'tower:id,site_name,alamat_menara',
                'user:id,name,email',
                'responses' => function ($query) use ($responseSelect) {
                    $query->select($responseSelect)
                        ->with([
                            'user:id,name',
                            'assets:id,report_response_id,file_path,file_type',
                        ]);
                },
                'images:id,report_id,file_path,file_type',
            ])
            ->withCount([
                'allComments as comments_count'
            ])
            ->where('is_public', true)
            // Only show verified records: authenticated users OR verified guest users
            ->where(function($query) {
                $query->whereNotNull('user_id')
                      ->orWhereNotNull('email_verified_at');
            })
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Retrieve public feedback entries for the "My Messages" listing.
     */
    public function getPublicFeedbacks(bool $includeSenderDetails = true): Collection
    {
        if (!class_exists(Feedback::class) || !Schema::hasTable('feedbacks')) {
            return collect();
        }

        $responseSelect = ['id', 'feedback_id', 'created_at', 'user_id', 'message'];

        if ($includeSenderDetails) {
            $responseSelect = array_merge($responseSelect, ['sender_type', 'sender_name', 'sender_email', 'sender_phone']);
        }

        try {
            return Feedback::with([
                    'tower:id,site_name,alamat_menara',
                    'user:id,name,email',
                    'assets:id,feedback_id,file_path,file_type',
                    'responses' => function ($query) use ($responseSelect) {
                        $query->select($responseSelect)
                            ->with([
                                'user:id,name',
                                'assets:id,feedback_response_id,file_path,file_type',
                            ]);
                    },
                ])
                ->withCount([
                    'allComments as comments_count'
                ])
                ->where('is_public', true)
                // Only show verified records: authenticated users OR verified guest users
                ->where(function($query) {
                    $query->whereNotNull('user_id')
                          ->orWhereNotNull('email_verified_at');
                })
                ->orderByDesc('created_at')
                ->get();
        } catch (\Throwable $exception) {
            Log::warning('Feedbacks table access failed: ' . $exception->getMessage());
            return collect();
        }
    }
}