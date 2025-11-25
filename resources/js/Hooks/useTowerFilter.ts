import { useMemo } from 'react';
import { filterTowers } from '@/utils/searchUtils';
import type { Tower } from '@/types';

/**
 * Custom hook for advanced tower filtering with fuzzy search
 * Uses the centralized filterTowers utility function
 * 
 * @param towers All available towers
 * @param searchTerm The search query entered by user
 * @returns Filtered towers based on relevance (memoized)
 */
export function useTowerFilter(towers: Tower[], searchTerm: string): Tower[] {
  return useMemo(() => {
    return filterTowers(towers, searchTerm);
  }, [towers, searchTerm]);
}

/**
 * Hook to filter towers that have valid coordinates
 * @param towers All available towers
 * @returns Only towers with valid coordinates
 */
export function useTowersWithCoordinates(towers: Array<{
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}>) {
  return useMemo(() => {
    return towers.filter(tower => 
      tower.latitude && 
      tower.longitude && 
      !isNaN(Number(tower.latitude)) && 
      !isNaN(Number(tower.longitude))
    );
  }, [towers]);
}
