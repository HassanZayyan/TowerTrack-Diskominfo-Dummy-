<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tower;
use App\Services\CacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Example controller showing how to use CacheService for API responses
 * Copy these patterns to other controllers for better performance
 */
class CachedTowerController extends Controller
{
    /**
     * Get all towers with caching
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Cache for 1 hour (3600 seconds)
        $towers = CacheService::remember(
            CacheService::towerListKey(),
            function () {
                return Tower::with(['owner'])
                    ->select(['id', 'site_name', 'latitude', 'longitude', 'height', 'owner_id'])
                    ->get();
            },
            3600
        );

        return response()->json([
            'success' => true,
            'data' => $towers,
            'cached' => true
        ]);
    }

    /**
     * Get a specific tower with caching
     * 
     * @param int $id Tower ID
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $tower = CacheService::remember(
            CacheService::towerKey($id),
            function () use ($id) {
                return Tower::with(['owner'])
                    ->findOrFail($id);
            },
            3600
        );

        return response()->json([
            'success' => true,
            'data' => $tower,
            'cached' => true
        ]);
    }

    /**
     * Example: Search towers with dynamic caching based on filters
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $filters = $request->only(['owner_id', 'status', 'search']);
        
        // Create cache key based on filters
        $cacheKey = CacheService::towerListKey($filters);
        
        $towers = CacheService::remember(
            $cacheKey,
            function () use ($filters) {
                $query = Tower::with(['owner'])
                    ->select(['id', 'site_name', 'latitude', 'longitude', 'height', 'owner_id']);
                
                // Apply filters
                if (isset($filters['owner_id'])) {
                    $query->where('owner_id', $filters['owner_id']);
                }
                
                if (isset($filters['search'])) {
                    $query->where('site_name', 'like', '%' . $filters['search'] . '%');
                }
                
                return $query->get();
            },
            1800 // Cache search results for 30 minutes
        );

        return response()->json([
            'success' => true,
            'data' => $towers,
            'filters' => $filters,
            'cached' => true
        ]);
    }

    /**
     * Clear tower caches (call this after create/update/delete operations)
     * 
     * @return JsonResponse
     */
    public function clearCache(): JsonResponse
    {
        CacheService::invalidateTowerCaches();

        return response()->json([
            'success' => true,
            'message' => 'Tower caches cleared successfully'
        ]);
    }
}

