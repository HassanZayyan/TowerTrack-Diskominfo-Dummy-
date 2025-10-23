<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if ($this->shouldReport($e)) {
                $this->logException($e);
            }
        });
    }

    /**
     * Log exception with detailed context
     */
    protected function logException(Throwable $e): void
    {
        $context = [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'user_id' => auth()->id(),
            'timestamp' => now()->toISOString(),
        ];

        // Add request data for non-production environments
        if (config('app.debug')) {
            $context['request_data'] = request()->all();
            $context['headers'] = request()->headers->all();
        }

        // Log based on exception type
        if ($e instanceof ValidationException) {
            Log::warning('Validation failed', $context);
        } elseif ($e instanceof HttpException) {
            if ($e->getStatusCode() >= 500) {
                Log::error('HTTP Server Error', $context);
            } else {
                Log::warning('HTTP Client Error', $context);
            }
        } else {
            Log::error('Application Error', $context);
        }
    }

    /**
     * Determine if the exception should be reported.
     */
    public function shouldReport(Throwable $e): bool
    {
        // Don't report validation exceptions
        if ($e instanceof ValidationException) {
            return false;
        }

        // Don't report 404 errors
        if ($e instanceof HttpException && $e->getStatusCode() === 404) {
            return false;
        }

        return parent::shouldReport($e);
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle API requests differently
        if ($request->expectsJson()) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions
     */
    protected function handleApiException($request, Throwable $e)
    {
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        if ($e instanceof HttpException) {
            return response()->json([
                'message' => $e->getMessage(),
                'status' => $e->getStatusCode(),
            ], $e->getStatusCode());
        }

        // For other exceptions, return generic error in production
        if (config('app.debug')) {
            return response()->json([
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }

        return response()->json([
            'message' => 'Internal Server Error',
        ], 500);
    }
}
