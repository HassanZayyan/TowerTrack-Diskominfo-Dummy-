import { usePage } from '@inertiajs/react';

/**
 * Custom hook to retrieve guest data from Inertia page props.
 * 
 * @returns Guest data object with email, phone, and name, or null if not available
 */
export function useGuestData(): {
  email: string;
  phone: string;
  name: string;
} | null {
  const { guestData } = usePage().props as any;
  return guestData || null;
}

/**
 * Custom hook to get initial form values from guest data with fallback.
 * 
 * @param defaults Default values to use if guest data is not available
 * @returns Object with email, phone, and name values
 */
export function useGuestFormData(defaults: {
  email?: string;
  phone?: string;
  name?: string;
} = {}): {
  email: string;
  phone: string;
  name: string;
} {
  const guestData = useGuestData();

  return {
    email: defaults.email || guestData?.email || '',
    phone: defaults.phone || guestData?.phone || '',
    name: defaults.name || guestData?.name || '',
  };
}

