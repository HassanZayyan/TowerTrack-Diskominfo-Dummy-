/**
 * Utility functions for route cache validation and management
 * DRY: Centralized cache validation logic
 */

export interface CacheValidationResult {
  isValid: boolean;
  shouldInvalidate: boolean;
  reason?: string;
  routeUpdatedAt?: number;
  cacheUpdatedAt?: number;
}

/**
 * Validate cache against route updated_at timestamp
 */
export function validateCacheTimestamp(
  routeUpdatedAt: number | null | undefined,
  cacheUpdatedAt: number | null | undefined
): CacheValidationResult {
  // No route updated_at - can't validate, invalidate for safety
  if (!routeUpdatedAt) {
    return {
      isValid: false,
      shouldInvalidate: true,
      reason: 'Route missing updated_at in props',
    };
  }

  // No cache updated_at - can't validate, invalidate for safety
  if (!cacheUpdatedAt) {
    return {
      isValid: false,
      shouldInvalidate: true,
      reason: 'Cache missing updated_at',
    };
  }

  // Route was updated after cache was created
  if (routeUpdatedAt > cacheUpdatedAt) {
    return {
      isValid: false,
      shouldInvalidate: true,
      reason: 'Route was updated after cache was created',
      routeUpdatedAt,
      cacheUpdatedAt,
    };
  }

  // Timestamps don't match (route < cache) - shouldn't happen, but invalidate for safety
  if (routeUpdatedAt !== cacheUpdatedAt) {
    return {
      isValid: false,
      shouldInvalidate: true,
      reason: 'Updated_at mismatch between route and cache',
      routeUpdatedAt,
      cacheUpdatedAt,
    };
  }

  // Cache is valid
  return {
    isValid: true,
    shouldInvalidate: false,
    routeUpdatedAt,
    cacheUpdatedAt,
  };
}

/**
 * Format timestamp for logging
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate difference in seconds between two timestamps
 */
export function getTimestampDifference(timestamp1: number, timestamp2: number): number {
  return Math.abs(timestamp1 - timestamp2);
}

/**
 * Get cache key for route
 */
export function getRouteCacheKey(routeId: number): string {
  return `fo_route_cache_${routeId}`;
}

/**
 * Remove route from memory cache
 */
export function removeFromMemoryCache(
  routeId: number,
  setLoadedRoutes: React.Dispatch<React.SetStateAction<Map<number, any>>>
): void {
  setLoadedRoutes(prev => {
    const newMap = new Map(prev);
    newMap.delete(routeId);
    return newMap;
  });
}

/**
 * Remove route from sessionStorage cache
 */
export function removeFromSessionStorageCache(routeId: number): void {
  try {
    sessionStorage.removeItem(getRouteCacheKey(routeId));
  } catch (e) {
    console.warn(`Failed to remove sessionStorage cache for route ${routeId}:`, e);
  }
}

/**
 * Invalidate route cache (both memory and sessionStorage)
 */
export function invalidateRouteCache(
  routeId: number,
  setLoadedRoutes: React.Dispatch<React.SetStateAction<Map<number, any>>>
): void {
  removeFromMemoryCache(routeId, setLoadedRoutes);
  removeFromSessionStorageCache(routeId);
}

/**
 * Validate and log cache validation result
 */
export function validateAndLogCache(
  routeId: number,
  routeUpdatedAt: number | null | undefined,
  cacheUpdatedAt: number | null | undefined,
  context: string
): CacheValidationResult {
  const result = validateCacheTimestamp(routeUpdatedAt, cacheUpdatedAt);

  if (!result.isValid && result.shouldInvalidate) {
    if (result.reason?.includes('updated after')) {
      console.log(`🔄 Route ${routeId} was updated, invalidating ${context} cache`, {
        route_updated_at: result.routeUpdatedAt ? formatTimestamp(result.routeUpdatedAt) : 'N/A',
        cache_updated_at: result.cacheUpdatedAt ? formatTimestamp(result.cacheUpdatedAt) : 'N/A',
        difference_seconds: result.routeUpdatedAt && result.cacheUpdatedAt
          ? getTimestampDifference(result.routeUpdatedAt, result.cacheUpdatedAt)
          : 0,
      });
    } else {
      console.warn(`⚠️ Route ${routeId} ${result.reason} - invalidating ${context} cache`, {
        route_updated_at: result.routeUpdatedAt ? formatTimestamp(result.routeUpdatedAt) : 'N/A',
        cache_updated_at: result.cacheUpdatedAt ? formatTimestamp(result.cacheUpdatedAt) : 'N/A',
      });
    }
  }

  return result;
}

