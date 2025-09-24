<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TowerController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\Admin\MessagesController;
use App\Http\Controllers\FoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Tower;
use App\Http\Controllers\UserComplaintController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\StaffMiddleware;
use App\Http\Middleware\NonStaffMiddleware;
use App\Http\Middleware\TowerOwnerMiddleware;
use App\Http\Middleware\TowerOwnerAccessMiddleware;
use App\Http\Middleware\TowerAccessMiddleware;
use App\Http\Controllers\Admin\FoManagementController;

Route::get('/', function () {
    return redirect()->route('data.tower');
});

Route::get('/dashboard', function () {
    $user = auth()->user();
    if ($user && $user->role === 'tower_owner') {
        return redirect()->route('admin.towers.index');
    } elseif ($user && in_array($user->role, ['admin', 'operator'], true)) {
        return redirect()->route('admin.dashboard');
    } else {
        return redirect()->route('data.tower');
    }
})->middleware(['auth', 'verified'])->name('dashboard');

// Public Routes
Route::get('/data-tower', [TowerController::class, 'index'])->name('data.tower');
Route::get('/data-fo', [FoController::class, 'index'])->name('data.fo');
Route::post('/fo-route/{foRoute}/generate-geojson', [FoController::class, 'generateGeoJSONRoute'])->name('fo.route.generate-geojson');
Route::post('/api/fo-routes/generate-all', [FoController::class, 'generateAllGeoJSONRoutes'])->name('api.fo.routes.generate-all');
Route::get('/fo-details/{type}/{id}', [FoController::class, 'getDetails'])->name('fo.details');
Route::put('/fo-points/{id}', [FoController::class, 'updatePoint'])->name('fo.points.update');
Route::put('/fo-routes/{id}', [FoController::class, 'updateRoute'])->name('fo.routes.update');
Route::get('/tower/{tower}', [TowerController::class, 'show'])->name('tower.show');

// Public feedback and complaint forms (no authentication required)
Route::get('/feedback', [FeedbackController::class, 'index'])->name('feedback');
Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');

Route::get('/complaint', [UserComplaintController::class, 'index'])->name('complaint');
Route::post('/complaint', [UserComplaintController::class, 'store'])->name('complaint.store');

// User feedback list and details (authenticated or anonymous with email)
Route::get('/my-feedbacks', [FeedbackController::class, 'userFeedbacks'])->name('my.feedbacks');
Route::get('/feedback/{feedback}', [FeedbackController::class, 'show'])->name('feedback.show');

// User reports page (messages) - accessible by authenticated users or anonymous with email
Route::get('/my-messages', function () {
    if (auth()->check()) {
        // Authenticated user
        $reports = \App\Models\Report::with([
            'tower:id,site_name,alamat_menara', 
            'responses' => function ($q) {
                $q->select('id','report_id','message','created_at','user_id')
                  ->with(['user:id,name', 'assets:id,report_response_id,file_path,file_type']);
            },
            'images:id,report_id,file_path,file_type'
        ])
        ->where('user_id', auth()->id())
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($report) {
            $statusMap = [1 => 'pending', 2 => 'in_progress', 3 => 'closed'];
            $report->setAttribute('status', $statusMap[$report->status_id] ?? 'pending');
            return $report;
        });

        $feedbacks = collect();
        
        try {
            if (class_exists('App\\Models\\Feedback') && \Schema::hasTable('feedbacks')) {
                $feedbacks = \App\Models\Feedback::with([
                    'tower:id,site_name,alamat_menara',
                    'assets:id,feedback_id,file_path,file_type',
                    'responses' => function ($q) {
                        $q->select('id','feedback_id','created_at','user_id','message')
                          ->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
                    }
                ])
                ->where('user_id', auth()->id())
                ->orderByDesc('created_at')
                ->get();
            }
        } catch (\Exception $e) {
            \Log::warning('Feedbacks table access failed: ' . $e->getMessage());
            $feedbacks = collect();
        }
    } else {
        // Anonymous user - check email query parameter
        $email = request()->query('email');
        if (!$email) {
            return Inertia::render('MyMessages/Index', [
                'reports' => [],
                'feedbacks' => [],
                'showEmailInput' => true,
            ]);
        }
        
        $reports = \App\Models\Report::with([
            'tower:id,site_name,alamat_menara', 
            'responses' => function ($q) {
                $q->select('id','report_id','message','created_at','user_id')
                  ->with(['user:id,name', 'assets:id,report_response_id,file_path,file_type']);
            },
            'images:id,report_id,file_path,file_type'
        ])
        ->where('email', $email)
        ->whereNull('user_id')
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($report) {
            $statusMap = [1 => 'pending', 2 => 'in_progress', 3 => 'closed'];
            $report->setAttribute('status', $statusMap[$report->status_id] ?? 'pending');
            return $report;
        });
        
        $feedbacks = collect();
        try {
            if (class_exists('App\\Models\\Feedback') && \Schema::hasTable('feedbacks')) {
                $feedbacks = \App\Models\Feedback::with([
                    'tower:id,site_name,alamat_menara',
                    'assets:id,feedback_id,file_path,file_type',
                    'responses' => function ($q) {
                        $q->select('id','feedback_id','created_at','user_id','message')
                          ->with(['user:id,name', 'assets:id,feedback_response_id,file_path,file_type']);
                    }
                ])
                ->where('email', $email)
                ->whereNull('user_id')
                ->orderByDesc('created_at')
                ->get();
            }
        } catch (\Exception $e) {
            \Log::warning('Feedbacks table access failed: ' . $e->getMessage());
            $feedbacks = collect();
        }
    }

    return Inertia::render('MyMessages/Index', [
        'reports' => $reports,
        'feedbacks' => $feedbacks,
        'showEmailInput' => false,
        'isAnonymous' => !auth()->check(),
    ]);
})->name('my.messages');

// Admin/Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin/Operator/Tower Owner routes (staff) - All staff can access dashboard and towers
Route::middleware(['auth', StaffMiddleware::class])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard - accessible by admin and operator only (not tower_owner)
    Route::middleware(['tower.owner.dashboard.redirect'])->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    });

    // Users management
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');
    });

    // Unified Messages index
    Route::get('/messages', [MessagesController::class, 'index'])->name('messages.index');

    // Legacy index routes redirect to unified messages while keeping action routes intact
    Route::get('/complaints', function () {
        return redirect()->route('admin.messages.index', ['tab' => 'complaints']);
    })->name('complaints.index');
    Route::get('/feedbacks', function () {
        return redirect()->route('admin.messages.index', ['tab' => 'feedbacks']);
    })->name('feedbacks.index');

    // Complaints actions
    Route::post('/complaints/{report}/respond', [\App\Http\Controllers\Admin\ComplaintController::class, 'respond'])->name('complaints.respond');
    Route::put('/complaints/{report}', [\App\Http\Controllers\Admin\ComplaintController::class, 'updateStatus'])->name('complaints.updateStatus');

    // Tower management - accessible by admin, operator, and tower_owner (full CRUD operations)
    Route::middleware([TowerAccessMiddleware::class, 'tower.owner.access.control'])->group(function () {
        Route::get('/towers', [\App\Http\Controllers\Admin\TowerController::class, 'index'])->name('towers.index');
        Route::get('/towers/create', [\App\Http\Controllers\Admin\TowerController::class, 'create'])->name('towers.create');
        Route::post('/towers', [\App\Http\Controllers\Admin\TowerController::class, 'store'])->name('towers.store');
        Route::put('/towers/{tower}', [\App\Http\Controllers\Admin\TowerController::class, 'update'])->name('towers.update');
    });

    // Feedback management actions
    Route::get('/feedbacks/{feedback}', [\App\Http\Controllers\Admin\FeedbackController::class, 'show'])->name('feedbacks.show');
    Route::post('/feedbacks/{feedback}/respond', [\App\Http\Controllers\Admin\FeedbackController::class, 'respond'])->name('feedbacks.respond');
    Route::put('/feedbacks/{feedback}/status', [\App\Http\Controllers\Admin\FeedbackController::class, 'updateStatus'])->name('feedbacks.updateStatus');

    // FO management routes: admin and operator can CRUD
    Route::middleware('admin_or_operator')->group(function () {
        // Main FO Management Routes (Route-first flow)
        Route::get('/fo-management', [FoManagementController::class, 'routesList'])->name('fo-management.routes.list');
        
        // Legacy overview removed; keep redirect for backward compatibility
        Route::get('/fo-management/overview', function () {
            return redirect()->route('admin.fo-management.routes.list');
        });
        
        // FO Routes Management - specific routes must come before parameterized routes
        Route::get('/fo-management/routes/create', [FoManagementController::class, 'createRoute'])->name('fo-management.routes.create');
        Route::get('/fo-management/routes/{foRoute}', [FoManagementController::class, 'routeDetail'])->name('fo-management.routes.detail');
        Route::post('/fo-management/routes', [FoManagementController::class, 'storeRoute'])->name('fo-management.routes.store');
        Route::get('/fo-management/routes/{foRoute}/edit', [FoManagementController::class, 'editRoute'])->name('fo-management.routes.edit');
        Route::put('/fo-management/routes/{foRoute}', [FoManagementController::class, 'updateRoute'])->name('fo-management.routes.update');
        Route::delete('/fo-management/routes/{foRoute}', [FoManagementController::class, 'destroyRoute'])->name('fo-management.routes.destroy');
        Route::post('/fo-management/routes/bulk-action', [FoManagementController::class, 'bulkRoutesAction'])->name('fo-management.routes.bulk-action');
        
        // FO Points Management
        Route::get('/fo-management/routes/{foRoute}/points/create', [FoManagementController::class, 'createPoint'])->name('fo-management.points.create');
        Route::post('/fo-management/points', [FoManagementController::class, 'storePoint'])->name('fo-management.points.store');
        Route::get('/fo-management/points/{foPoint}/edit', [FoManagementController::class, 'editPoint'])->name('fo-management.points.edit');
        Route::put('/fo-management/points/{foPoint}', [FoManagementController::class, 'updatePoint'])->name('fo-management.points.update');
        Route::delete('/fo-management/points/{foPoint}', [FoManagementController::class, 'destroyPoint'])->name('fo-management.points.destroy');
        Route::post('/fo-management/points/bulk-action', [FoManagementController::class, 'bulkPointsAction'])->name('fo-management.points.bulk-action');

        // FO Export (CSV downloads)
        Route::get('/fo-management/points/export', [FoManagementController::class, 'exportPoints'])->name('fo-management.points.export');
        Route::get('/fo-management/routes/export', [FoManagementController::class, 'exportRoutes'])->name('fo-management.routes.export');

    });

    // Tower owner specific routes
    Route::middleware(TowerOwnerMiddleware::class)->group(function () {
        // Add tower owner specific routes here if needed
        // For now, they can access the general admin routes through StaffMiddleware
    });
});

require __DIR__.'/auth.php';
