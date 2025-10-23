<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FoRouteService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * API controller for FO Route operations with error handling
 */
class FoRouteController extends Controller
{
    /**
     * Get active routes by area
     */
    public function getActiveRoutes(Request $request): JsonResponse
    {
        try {
            $area = $request->get('area', 'ungaran');
            
            // Validate area parameter
            if (!in_array($area, ['ungaran', 'ambarawa'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Area tidak valid. Gunakan: ungaran atau ambarawa'
                ], 400);
            }
            
            $routes = FoRouteService::getActiveRoutesByArea($area);
            
            return response()->json([
                'success' => true,
                'data' => $routes,
                'meta' => [
                    'area' => $area,
                    'total' => $routes->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch FO routes', [
                'area' => $request->get('area', 'ungaran'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data jalur FO',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get route by ID
     */
    public function getRoute(int $id): JsonResponse
    {
        try {
            $route = FoRouteService::getRouteById($id);
            
            if (!$route) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jalur FO tidak ditemukan'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $route
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch FO route', [
                'route_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data jalur FO',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get route GeoJSON
     */
    public function getRouteGeoJSON(int $id): JsonResponse
    {
        try {
            $geojson = FoRouteService::getRouteGeoJSON($id);
            
            if (!$geojson) {
                return response()->json([
                    'success' => false,
                    'message' => 'GeoJSON tidak tersedia untuk jalur ini'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $geojson
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch FO route GeoJSON', [
                'route_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat GeoJSON jalur FO',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get route statistics
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $area = $request->get('area', 'ungaran');
            
            // Validate area parameter
            if (!in_array($area, ['ungaran', 'ambarawa'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Area tidak valid. Gunakan: ungaran atau ambarawa'
                ], 400);
            }
            
            $stats = FoRouteService::getRouteStatistics($area);
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch FO route statistics', [
                'area' => $request->get('area', 'ungaran'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat statistik jalur FO',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Update route
     */
    public function updateRoute(Request $request, int $id): JsonResponse
    {
        try {
            $route = FoRouteService::updateRoute($id, $request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Jalur FO berhasil diperbarui',
                'data' => $route
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Jalur FO tidak ditemukan'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update FO route', [
                'route_id' => $id,
                'data' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jalur FO',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
