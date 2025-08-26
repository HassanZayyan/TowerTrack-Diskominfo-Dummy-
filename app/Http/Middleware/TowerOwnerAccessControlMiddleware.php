<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tower;

class TowerOwnerAccessControlMiddleware
{
    /**
     * Handle an incoming request.
     * Restrict tower owners to only access towers they own
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // If not a tower owner, allow access (admin/operator can access all)
        if (!$user || $user->role !== 'tower_owner') {
            return $next($request);
        }
        
        // For tower owners, check if they're trying to access a specific tower
        $towerParam = $request->route('tower');
        
        // Handle both cases: tower ID or tower object
        $towerId = is_object($towerParam) ? $towerParam->id : $towerParam;
        
        if ($towerId) {
            // Check if the tower belongs to this user
            $tower = Tower::find($towerId);
            
            if (!$tower) {
                abort(404, 'Tower not found');
            }
            
            // Check if user owns this tower - specify table name to avoid ambiguity
            if ($user->owner && !$user->owner->towers()->where('towers.id', $towerId)->exists()) {
                abort(403, 'You can only access towers you own');
            }
        }
        
        return $next($request);
    }
}



