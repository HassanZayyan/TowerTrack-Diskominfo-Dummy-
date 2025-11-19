import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

interface UseGuestAutoRedirectOptions {
  /**
   * Current email from URL query params or props
   */
  email?: string | null;
  /**
   * Current phone from URL query params or props
   */
  phone?: string | null;
  /**
   * Whether user is authenticated
   */
  isAuthenticated?: boolean;
  /**
   * Current URL path (without query params)
   */
  currentPath?: string;
  /**
   * Additional query params to preserve
   */
  preserveQuery?: Record<string, string>;
  /**
   * Only redirect if these conditions are met
   */
  enabled?: boolean;
}

/**
 * Custom hook to automatically redirect guest users with query params from cookie.
 * 
 * This hook checks if guest data exists in cookie and redirects to the same page
 * with email and phone query params if they're not already present.
 * 
 * @param options Configuration options
 */
export function useGuestAutoRedirect(options: UseGuestAutoRedirectOptions = {}): void {
  const {
    email,
    phone,
    isAuthenticated = false,
    currentPath,
    preserveQuery = {},
    enabled = true,
  } = options;

  const { guestData } = usePage().props as any;

  useEffect(() => {
    if (!enabled) return;
    if (isAuthenticated) return;
    if (email || phone) return; // Already has query params
    if (!guestData?.email || !guestData?.phone) return; // No guest data

    const path = currentPath || window.location.pathname;
    const queryParams = new URLSearchParams({
      email: guestData.email,
      phone: guestData.phone,
      ...preserveQuery,
    });

    router.visit(`${path}?${queryParams.toString()}`, {
      preserveState: true,
      preserveScroll: true,
    });
  }, [enabled, isAuthenticated, email, phone, guestData, currentPath, preserveQuery]);
}

