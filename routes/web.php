<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TowerController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\FoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Tower;
use App\Http\Controllers\UserComplaintController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\StaffMiddleware;
use App\Http\Middleware\NonStaffMiddleware;

Route::get('/', function () {
    return redirect()->route('data.tower');
});

Route::get('/dashboard', function () {
    $user = auth()->user();
    $destination = ($user && in_array($user->role, ['admin', 'operator'], true))
        ? 'admin.dashboard'
        : 'data.tower';
    return redirect()->route($destination);
})->middleware(['auth', 'verified'])->name('dashboard');

// Public Routes
Route::get('/data-tower', [TowerController::class, 'index'])->name('data.tower');
Route::get('/data-fo', [FoController::class, 'index'])->name('data.fo');
Route::get('/tower/{tower}', [TowerController::class, 'show'])->name('tower.show');

// Complaint form is only for non-staff users
Route::middleware(['auth', NonStaffMiddleware::class])->get('/complaint', [UserComplaintController::class, 'index'])->name('complaint');

Route::middleware(['auth', NonStaffMiddleware::class])->post('/complaint', [UserComplaintController::class, 'store'])->name('complaint.store');

// Feedback routes for non-staff users
Route::middleware(['auth', NonStaffMiddleware::class])->get('/feedback', [FeedbackController::class, 'index'])->name('feedback');

Route::middleware(['auth', NonStaffMiddleware::class])->post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');

// User feedback list and details
Route::middleware('auth')->get('/my-feedbacks', [FeedbackController::class, 'userFeedbacks'])->name('my.feedbacks');

Route::middleware('auth')->get('/feedback/{feedback}', [FeedbackController::class, 'show'])->name('feedback.show');

// User reports page (messages)
Route::middleware('auth')->get('/my-messages', function () {
    $reports = \App\Models\Report::with([
            'tower:id,site_name,alamat_menara', 
            'responses:id,report_id,message,created_at', 
            'images:id,report_id,file_path,file_type'
        ])
        ->where('user_id', auth()->id())
        ->orderByDesc('created_at')
        ->get();

    $feedbacks = collect();
    
    // Safe check for feedbacks table and model
    try {
        if (class_exists('App\\Models\\Feedback') && \Schema::hasTable('feedbacks')) {
            $feedbacks = \App\Models\Feedback::with(['tower:id,site_name', 'responses:id,feedback_id,created_at'])
                ->where('user_id', auth()->id())
                ->orderByDesc('created_at')
                ->get();
        }
    } catch (\Exception $e) {
        // Log error but don't break the page
        \Log::warning('Feedbacks table access failed: ' . $e->getMessage());
        $feedbacks = collect();
    }

    return Inertia::render('MyMessages/Index', [
        'reports' => $reports,
        'feedbacks' => $feedbacks,
    ]);
})->name('my.messages');

// Admin/Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin/Operator routes (staff)
Route::middleware(['auth', StaffMiddleware::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');

    // Users management
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');
    });

    // Complaints management
    Route::get('/complaints', [\App\Http\Controllers\Admin\ComplaintController::class, 'index'])->name('complaints.index');
    Route::post('/complaints/{report}/respond', [\App\Http\Controllers\Admin\ComplaintController::class, 'respond'])->name('complaints.respond');
    Route::put('/complaints/{report}', [\App\Http\Controllers\Admin\ComplaintController::class, 'updateStatus'])->name('complaints.updateStatus');

    // Tower management
    Route::get('/towers', [\App\Http\Controllers\Admin\TowerController::class, 'index'])->name('towers.index');
    Route::get('/towers/create', [\App\Http\Controllers\Admin\TowerController::class, 'create'])->name('towers.create');
    Route::post('/towers', [\App\Http\Controllers\Admin\TowerController::class, 'store'])->name('towers.store');
    Route::put('/towers/{tower}', [\App\Http\Controllers\Admin\TowerController::class, 'update'])->name('towers.update');

    // Feedback management
    Route::get('/feedbacks', [\App\Http\Controllers\Admin\FeedbackController::class, 'index'])->name('feedbacks.index');
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
});

require __DIR__.'/auth.php';
