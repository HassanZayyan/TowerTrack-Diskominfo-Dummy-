<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\Report;
use App\Services\CacheService;
use App\Services\PublicMessageQueryService;
use App\Traits\HasMessageableRelationships;
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
    use HasMessageableRelationships;
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

        $user = auth()->user();
        
        // Admin and operator cannot access "Pesan Saya" - redirect to public messages
        if (in_array($user->role, ['admin', 'operator'], true)) {
            return redirect()->route('my.messages')->with('message', 'Admin dan operator tidak dapat mengakses halaman Pesan Saya. Silakan gunakan halaman pesan publik untuk melihat pesan.');
        }

        $userId = $user->id;
        $pagination = $this->getPaginationParams($request, 15);

        // Cache key includes user ID and pagination params
        $reportsCacheKey = CacheService::paginatedKey('my_posts_reports', ['user_id' => $userId], $pagination['page'], $pagination['per_page']);
        $feedbacksCacheKey = CacheService::paginatedKey('my_posts_feedbacks', ['user_id' => $userId], $pagination['page'], $pagination['per_page']);

        // Get paginated reports with caching
        $reports = $this->cachedPaginate(
            'my_posts_reports',
            function () use ($userId) {
                return Report::with($this->getReportRelationships())
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
                        return Feedback::with($this->getFeedbackRelationships())
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

}

