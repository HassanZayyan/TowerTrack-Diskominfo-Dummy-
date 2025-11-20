import { useMemo } from 'react';

/**
 * DRY Hook for memoizing expensive computations
 * Provides type-safe memoization with dependency tracking
 * 
 * @param factory Function that returns the computed value
 * @param deps Dependency array
 * @returns Memoized value
 */
export function useMemoized<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Memoize a filtered array
 * 
 * @param items Array to filter
 * @param filterFn Filter function
 * @param deps Dependencies for the filter function
 * @returns Memoized filtered array
 */
export function useFiltered<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: React.DependencyList = []
): T[] {
  return useMemoized(() => items.filter(filterFn), [items, ...deps]);
}

/**
 * Memoize a sorted array
 * 
 * @param items Array to sort
 * @param sortFn Sort function
 * @param deps Dependencies for the sort function
 * @returns Memoized sorted array
 */
export function useSorted<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  deps: React.DependencyList = []
): T[] {
  return useMemoized(() => [...items].sort(sortFn), [items, ...deps]);
}

