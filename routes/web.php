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

    // FO management routes (for admin only)
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::post('/fo/points', [FoController::class, 'storePoint'])->name('fo.points.store');
        Route::put('/fo/points/{foPoint}', [FoController::class, 'updatePoint'])->name('fo.points.update');
        Route::delete('/fo/points/{foPoint}', [FoController::class, 'deletePoint'])->name('fo.points.delete');
        Route::post('/fo/routes', [FoController::class, 'storeRoute'])->name('fo.routes.store');
        Route::put('/fo/routes/{foRoute}', [FoController::class, 'updateRoute'])->name('fo.routes.update');
        Route::delete('/fo/routes/{foRoute}', [FoController::class, 'deleteRoute'])->name('fo.routes.delete');
    });

    // Tower owner specific routes
    Route::middleware(TowerOwnerMiddleware::class)->group(function () {
        // Add tower owner specific routes here if needed
        // For now, they can access the general admin routes through StaffMiddleware
    });
});

require __DIR__.'/auth.php';
