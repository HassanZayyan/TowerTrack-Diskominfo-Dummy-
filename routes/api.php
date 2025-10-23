<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CachedTowerController;
use App\Http\Controllers\Api\FoRouteController;
use App\Http\Controllers\UserComplaintController;
use App\Http\Controllers\FeedbackController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public API routes with rate limiting
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/towers', [CachedTowerController::class, 'index'])->name('api.towers.index');
    Route::get('/towers/{tower}', [CachedTowerController::class, 'show'])->name('api.towers.show');
    
    // FO Routes API
    Route::get('/fo-routes', [FoRouteController::class, 'getActiveRoutes'])->name('api.fo-routes.index');
    Route::get('/fo-routes/{id}', [FoRouteController::class, 'getRoute'])->name('api.fo-routes.show');
    Route::get('/fo-routes/{id}/geojson', [FoRouteController::class, 'getRouteGeoJSON'])->name('api.fo-routes.geojson');
    Route::get('/fo-routes/statistics', [FoRouteController::class, 'getStatistics'])->name('api.fo-routes.statistics');
});

// Form submission routes with stricter rate limiting
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/complaints', [UserComplaintController::class, 'store'])->name('api.complaints.store');
    Route::post('/feedbacks', [FeedbackController::class, 'store'])->name('api.feedbacks.store');
});

// Admin API routes with authentication and rate limiting
Route::middleware(['auth:sanctum', 'throttle:30,1'])->group(function () {
    Route::get('/admin/stats', function (Request $request) {
        return response()->json([
            'user' => $request->user(),
            'timestamp' => now(),
        ]);
    })->name('api.admin.stats');
    
    // Admin FO Routes API
    Route::put('/fo-routes/{id}', [FoRouteController::class, 'updateRoute'])->name('api.fo-routes.update');
    
    // Cache management routes
    Route::delete('/towers/{id}/cache', [CachedTowerController::class, 'invalidateCache'])->name('api.towers.cache.invalidate');
    Route::post('/towers/cache/warm-up', [CachedTowerController::class, 'warmUpCaches'])->name('api.towers.cache.warm-up');
});
