import { useMemo } from 'react';

/**
 * Custom hook for memoizing expensive calculations
 * @param factory - The function that creates the value
 * @param deps - The dependencies array
 * @returns The memoized value
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Custom hook for memoizing callback functions
 * @param callback - The callback function to memoize
 * @param deps - The dependencies array
 * @returns The memoized callback function
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useMemo(() => callback, deps);
}
