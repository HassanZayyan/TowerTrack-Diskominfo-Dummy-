import { useState, useEffect, useCallback } from 'react';
import {
  validateCacheTimestamp,
  invalidateRouteCache,
  getRouteCacheKey,
  validateAndLogCache,
  formatTimestamp,
} from '@/utils/routeCacheUtils';

interface FoRoute {
  id: number;
  updated_at?: number | null;
}

interface UseRouteCacheOptions {
  foRoutes: FoRoute[];
}

export function useRouteCache({ foRoutes }: UseRouteCacheOptions) {
  const [loadedRoutes, setLoadedRoutes] = useState<Map<number, any>>(new Map());
  const [loadingRoutes, setLoadingRoutes] = useState<Set<number>>(new Set());

  /**
   * Validate memory cache for a route
   */
  const validateMemoryCache = useCallback((routeId: number): boolean => {
    const route = foRoutes.find((r: FoRoute) => r.id === routeId);
    if (!route) return false;

    if (!loadedRoutes.has(routeId)) return false;

    const cachedData = loadedRoutes.get(routeId);
    const result = validateAndLogCache(
      routeId,
      route.updated_at,
      cachedData?.updated_at,
      'memory'
    );

    if (!result.isValid && result.shouldInvalidate) {
      invalidateRouteCache(routeId, setLoadedRoutes);
      return false;
    }

    return result.isValid;
  }, [foRoutes, loadedRoutes]);

  /**
   * Validate sessionStorage cache for a route
   */
  const validateSessionStorageCache = useCallback((routeId: number): any | null => {
    const route = foRoutes.find((r: FoRoute) => r.id === routeId);
    if (!route) return null;

    try {
      const cacheKey = getRouteCacheKey(routeId);
      const cached = sessionStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const { data, timestamp, route_updated_at } = JSON.parse(cached);
      const cacheDataUpdatedAt = data?.updated_at || route_updated_at;

      // Validate against route.updated_at
      const result = validateAndLogCache(
        routeId,
        route.updated_at,
        cacheDataUpdatedAt,
        'sessionStorage'
      );

      if (!result.isValid && result.shouldInvalidate) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      // Check time-based expiration (24 hours)
      const age = Date.now() - timestamp;
      const maxAge = 24 * 60 * 60 * 1000;
      
      if (age >= maxAge) {
        sessionStorage.removeItem(cacheKey);
        console.log(`🗑️ Route ${routeId} cache expired (age: ${Math.round(age / 1000 / 60)} minutes)`);
        return null;
      }

      return data;
    } catch (e) {
      console.warn(`Failed to check sessionStorage for route ${routeId}:`, e);
      return null;
    }
  }, [foRoutes]);

  /**
   * Watch for route updated_at changes and invalidate cache automatically
   */
  useEffect(() => {
    foRoutes.forEach((route: FoRoute) => {
      if (!route.updated_at) return;

      // Check memory cache
      if (loadedRoutes.has(route.id)) {
        const cachedData = loadedRoutes.get(route.id);
        if (cachedData?.updated_at && route.updated_at > cachedData.updated_at) {
          console.log(`🔄 Route ${route.id} updated_at changed, invalidating memory cache`, {
            route_updated_at: formatTimestamp(route.updated_at),
            cache_updated_at: formatTimestamp(cachedData.updated_at),
          });
          invalidateRouteCache(route.id, setLoadedRoutes);
        }
      }

      // Check sessionStorage cache
      try {
        const cacheKey = getRouteCacheKey(route.id);
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { route_updated_at } = JSON.parse(cached);
          if (route_updated_at && route.updated_at > route_updated_at) {
            console.log(`🔄 Route ${route.id} updated_at changed, invalidating sessionStorage cache`, {
              route_updated_at: formatTimestamp(route.updated_at),
              cache_updated_at: formatTimestamp(route_updated_at),
            });
            sessionStorage.removeItem(cacheKey);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    });
  }, [foRoutes, loadedRoutes]);

  /**
   * Restore cached routes from sessionStorage on mount
   */
  useEffect(() => {
    const restoredRoutes = new Map<number, any>();
    let restoredCount = 0;
    let invalidatedCount = 0;

    foRoutes.forEach((route: FoRoute) => {
      const cachedData = validateSessionStorageCache(route.id);
      if (cachedData) {
        restoredRoutes.set(route.id, cachedData);
        restoredCount++;
      } else if (sessionStorage.getItem(getRouteCacheKey(route.id))) {
        invalidatedCount++;
      }
    });

    if (restoredCount > 0) {
      setLoadedRoutes(restoredRoutes);
      console.log(`✅ Restored ${restoredCount} routes from sessionStorage cache`);
    }
    if (invalidatedCount > 0) {
      console.log(`🗑️ Invalidated ${invalidatedCount} routes from sessionStorage cache`);
    }
  }, [foRoutes, validateSessionStorageCache]);

  return {
    loadedRoutes,
    setLoadedRoutes,
    loadingRoutes,
    setLoadingRoutes,
    validateMemoryCache,
    validateSessionStorageCache,
  };
}

