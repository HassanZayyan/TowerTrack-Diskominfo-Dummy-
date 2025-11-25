<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\Report;
use App\Services\CacheService;
use App\Services\PublicMessageQueryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DRY Controller for My Messages functionality
 * Extends BaseController for caching and pagination helpers
 */
class MyMessagesController extends BaseController
{
    /**
     * Display public messages (reports and feedbacks)
     * 
     * @param Request $request
     * @param PublicMessageQueryService $messageQueryService
     * @return Response
     */
    public function index(Request $request, PublicMessageQueryService $messageQueryService): Response
    {
        $isAuthenticated = auth()->check();
        $cacheKey = CacheService::myMessagesKey($isAuthenticated);

        $data = CacheService::remember($cacheKey, function () use ($messageQueryService, $isAuthenticated) {
            return [
                'reports' => $messageQueryService->getPublicReports($isAuthenticated),
                'feedbacks' => $messageQueryService->getPublicFeedbacks($isAuthenticated),
            ];
        }, 1800); // Cache for 30 minutes

        return Inertia::render('MyMessages/Index', array_merge($data, [
            'showEmailInput' => false,
            'isAnonymous' => !$isAuthenticated,
        ]));
    }

    /**
     * Display user's own messages (both public and private)
     * Uses pagination for better performance
     * 
     * @param Request $request
     * @return Response|RedirectResponse
     */
    public function myPosts(Request $request): Response|RedirectResponse
    {
        if (!auth()->check()) {
            return redirect()->route('my.messages');
        }

        $userId = auth()->id();
        $pagination = $this->getPaginationParams($request, 15);

        // Cache key includes user ID and pagination params
        $reportsCacheKey = CacheService::paginatedKey('my_posts_reports', ['user_id' => $userId], $pagination['page'], $pagination['per_page']);
        $feedbacksCacheKey = CacheService::paginatedKey('my_posts_feedbacks', ['user_id' => $userId], $pagination['page'], $pagination['per_page']);

        // Get paginated reports with caching
        $reports = $this->cachedPaginate(
            'my_posts_reports',
            function () use ($userId) {
                return Report::with([
                    'tower:id,site_name,alamat_menara',
                    'user:id,name,email',
                    'responses' => function ($q) {
                        $q->select('id', 'report_id', 'message', 'created_at', 'user_id', 'sender_type', 'sender_name', 'sender_email', 'sender_phone')
                            ->with(['user:id,name', 'assets:id,report_response_id,file_path,file_type']);
                    },
                    'images:id,report_id,file_path,file_type'
                ])
                    ->withCount(['allComments as comments_count'])
                    ->where('user_id', $userId)
                    ->orderByDesc('created_at');
            },
            $request,
            ['user_id' => $userId],
            1800 // 30 minutes cache
        );

        // Get paginated feedbacks with caching
        $feedbacks = collect();
        if (class_exists(Feedback::class) && Schema::hasTable('feedbacks')) {
            try {
                $feedbacks = $this->cachedPaginate(
                    'my_posts_feedbacks',
                    function () use ($userId) {
                        return Feedback::with([
                            'tower:id,site_name,alamat_menara',
                            'user:id,name,email',
                            'assets:id,feedback_id,file_path,file_type',
                            'responses' => function ($q) {
                                $q->select('id', 'feedback_id', 'created_at', 'user_id', 'message', 'sender_type', 'sender_name', 'sender_email', 'sender_phone')
                                    ->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
                            }
                        ])
                            ->withCount(['allComments as comments_count'])
                            ->where('user_id', $userId)
                            ->orderByDesc('created_at');
                    },
                    $request,
                    ['user_id' => $userId],
                    1800 // 30 minutes cache
                );
            } catch (\Exception $e) {
                \Log::warning('Feedbacks table access failed: ' . $e->getMessage());
            }
        }

        return Inertia::render('MyMessages/Index', [
            'reports' => $reports,
            'feedbacks' => $feedbacks,
            'showEmailInput' => false,
            'isAnonymous' => false,
            'isMyPosts' => true,
        ]);
    }

    /**
     * Display guest private messages
     * 
     * @param Request $request
     * @return Response
     */
    public function privateTracking(Request $request): Response
    {
        $email = $request->query('email');
        $phone = $request->query('phone');

        if (!$email || !$phone) {
            return Inertia::render('MyMessages/PrivateTracking', [
                'reports' => [],
                'feedbacks' => [],
                'email' => $email,
                'phone' => $phone,
            ]);
        }

        // Cache key for guest private messages
        $cacheKey = CacheService::key('guest_private_messages', [
            'email' => $email,
            'phone' => $phone,
        ]);

        $data = CacheService::remember($cacheKey, function () use ($email, $phone) {
            // Get private reports
            $reports = Report::with([
                'tower:id,site_name,alamat_menara',
                'responses' => function ($q) {
                    $q->select('id', 'report_id', 'message', 'created_at', 'user_id', 'sender_type', 'sender_name', 'sender_email', 'sender_phone')
                        ->with(['user:id,name', 'assets:id,report_response_id,file_path,file_type']);
                },
                'images:id,report_id,file_path,file_type'
                ])
                ->withCount(['allComments as comments_count'])
                ->where('email', $email)
                ->where('reporter_phone', $phone)
                ->where('is_public', false)
                ->whereNull('user_id')
                ->whereNotNull('email_verified_at')
                ->orderByDesc('created_at')
                ->get();

            // Get private feedbacks
            $feedbacks = collect();
            if (class_exists(Feedback::class) && Schema::hasTable('feedbacks')) {
                try {
                    $feedbacks = Feedback::with([
                        'tower:id,site_name,alamat_menara',
                        'assets:id,feedback_id,file_path,file_type',
                        'responses' => function ($q) {
                            $q->select('id', 'feedback_id', 'created_at', 'user_id', 'message', 'sender_type', 'sender_name', 'sender_email', 'sender_phone')
                                ->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
                        }
                    ])
                        ->withCount(['allComments as comments_count'])
                        ->where('email', $email)
                        ->where('sender_phone', $phone)
                        ->where('is_public', false)
                        ->whereNull('user_id')
                        ->whereNotNull('email_verified_at')
                        ->orderByDesc('created_at')
                        ->get();
                } catch (\Exception $e) {
                    \Log::warning('Feedbacks table access failed: ' . $e->getMessage());
                }
            }

            return [
                'reports' => $reports,
                'feedbacks' => $feedbacks,
            ];
        }, 1800); // 30 minutes cache

        return Inertia::render('MyMessages/PrivateTracking', array_merge($data, [
            'email' => $email,
            'phone' => $phone,
        ]));
    }
}

