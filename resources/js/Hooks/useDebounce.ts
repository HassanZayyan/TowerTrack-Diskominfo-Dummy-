import { useState, useEffect } from 'react';

/**
 * DRY Hook for debouncing values
 * Useful for search inputs, filters, and API calls
 * 
 * @param value Value to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


