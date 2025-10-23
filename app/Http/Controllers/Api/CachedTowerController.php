<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnhancedCacheService;
use App\Services\QueryOptimizationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * Cached API controller for tower data with error handling
 */
class CachedTowerController extends Controller
{
    /**
     * Get towers with caching and error handling
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Validate input parameters
            $request->validate([
                'search' => 'nullable|string|max:255',
                'owner' => 'nullable|string|max:255',
                'tower_type' => 'nullable|string|max:50',
                'coord' => 'nullable|in:with,without',
                'per_page' => 'nullable|integer|min:1|max:100'
            ]);
            
            $filters = $request->only(['search', 'owner', 'tower_type', 'coord', 'per_page']);
            $perPage = (int) ($filters['per_page'] ?? 10);
            
            // Use optimized service with caching
            $towers = EnhancedCacheService::rememberTowerList($filters, $perPage);
            
            return response()->json([
                'success' => true,
                'data' => $towers,
                'meta' => [
                    'total' => $towers->total(),
                    'per_page' => $towers->perPage(),
                    'current_page' => $towers->currentPage(),
                    'last_page' => $towers->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch towers', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data tower',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get single tower with caching and error handling
     */
    public function show(int $id): JsonResponse
    {
        try {
            // Validate ID parameter
            if ($id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID tower tidak valid'
                ], 400);
            }
            
            // Use optimized service with caching
            $tower = EnhancedCacheService::rememberTower($id);
            
            return response()->json([
                'success' => true,
                'data' => $tower
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Tower not found', [
                'tower_id' => $id,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Tower tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to fetch tower', [
                'tower_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data tower',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Invalidate tower cache
     */
    public function invalidateCache(int $id): JsonResponse
    {
        try {
            // Validate ID parameter
            if ($id <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID tower tidak valid'
                ], 400);
            }
            
            // Invalidate specific tower cache
            EnhancedCacheService::invalidateTower($id);
            
            Log::info('Tower cache invalidated', [
                'tower_id' => $id,
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Cache tower berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to invalidate tower cache', [
                'tower_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus cache tower',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Warm up tower caches
     */
    public function warmUpCaches(): JsonResponse
    {
        try {
            EnhancedCacheService::warmUpCaches();
            
            Log::info('Tower caches warmed up', [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Cache berhasil di-warm up'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to warm up caches', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal warm up cache',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}