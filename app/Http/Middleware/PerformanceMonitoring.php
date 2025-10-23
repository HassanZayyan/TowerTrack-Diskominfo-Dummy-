<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PerformanceMonitoring
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();
        
        $response = $next($request);
        
        $endTime = microtime(true);
        $endMemory = memory_get_usage();
        
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        $memoryUsage = $endMemory - $startMemory;
        $peakMemory = memory_get_peak_usage();
        
        // Log performance metrics
        $this->logPerformanceMetrics($request, $executionTime, $memoryUsage, $peakMemory);
        
        // Add performance headers for debugging
        if (config('app.debug')) {
            $response->headers->set('X-Execution-Time', round($executionTime, 2) . 'ms');
            $response->headers->set('X-Memory-Usage', $this->formatBytes($memoryUsage));
            $response->headers->set('X-Peak-Memory', $this->formatBytes($peakMemory));
        }
        
        return $response;
    }
    
    /**
     * Log performance metrics
     */
    protected function logPerformanceMetrics(Request $request, float $executionTime, int $memoryUsage, int $peakMemory): void
    {
        $context = [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'execution_time_ms' => round($executionTime, 2),
            'memory_usage_bytes' => $memoryUsage,
            'memory_usage_mb' => round($memoryUsage / 1024 / 1024, 2),
            'peak_memory_bytes' => $peakMemory,
            'peak_memory_mb' => round($peakMemory / 1024 / 1024, 2),
            'user_id' => auth()->id(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString(),
        ];
        
        // Log slow requests (>1s)
        if ($executionTime > 1000) {
            Log::warning('Slow request detected', $context);
        }
        
        // Log high memory usage (>50MB)
        if ($memoryUsage > 50 * 1024 * 1024) {
            Log::warning('High memory usage detected', $context);
        }
        
        // Log critical performance issues
        if ($executionTime > 5000 || $memoryUsage > 100 * 1024 * 1024) {
            Log::error('Critical performance issue detected', $context);
        }
        
        // Log all requests in debug mode
        if (config('app.debug')) {
            Log::info('Request performance metrics', $context);
        }
    }
    
    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
