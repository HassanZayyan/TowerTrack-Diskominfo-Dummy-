<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\FoPoint;

class ProviderOwnerAccessControlMiddleware
{
    /**
     * Handle an incoming request.
     * Restrict provider owners to only access FO points they own
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // If not a provider owner, allow access (admin/operator can access all)
        if (!$user || $user->role !== 'provider_owner') {
            return $next($request);
        }
        
        // For provider owners, check if they're trying to access a specific FO point
        $foPointParam = $request->route('foPoint');
        
        // Handle both cases: FO point ID or FO point object
        $foPointId = is_object($foPointParam) ? $foPointParam->id : $foPointParam;
        
        if ($foPointId) {
            // Check if the FO point belongs to this user's provider
            $foPoint = FoPoint::find($foPointId);
            
            if (!$foPoint) {
                abort(404, 'FO Point not found');
            }
            
            // Check if user's provider owns this FO point
            if ($user->provider && !$user->provider->foPoints()->where('fo_points.id', $foPointId)->exists()) {
                abort(403, 'You can only access FO points owned by your provider');
            }
        }
        
        return $next($request);
    }
}


