import { usePage } from '@inertiajs/react';

/**
 * Allowed roles that should return to my-posts page when coming from my-posts
 */
const ALLOWED_ROLES_FOR_MY_POSTS = ['complainant', 'tower_owner', 'provider_owner'] as const;

/**
 * Determines the return URL for detail pages based on context
 * 
 * @param fromQuery - Query parameter 'from' (e.g., 'my-posts')
 * @param userRole - Current user's role
 * @returns Return URL string
 */
export function getReturnUrl(
  fromQuery: string | null | undefined,
  userRole?: string | null
): string {
  // If explicitly coming from my-posts page
  if (fromQuery === 'my-posts') {
    // Check if user has one of the specified roles
    const normalizedRole = userRole?.toLowerCase();
    
    if (normalizedRole && ALLOWED_ROLES_FOR_MY_POSTS.includes(normalizedRole as typeof ALLOWED_ROLES_FOR_MY_POSTS[number])) {
      return '/my-messages/my-posts';
    }
  }
  
  // Default fallback
  return '/my-messages';
}

/**
 * Custom hook to get return URL for detail pages
 * Automatically extracts query params and user info from Inertia page props
 * 
 * @returns Object containing returnUrl and buttonLabel
 */
export function useReturnUrl(): {
  returnUrl: string;
  buttonLabel: string;
} {
  const { url, props } = usePage();
  const auth = (props as any)?.auth;
  const userRole = auth?.user?.role;
  
  // Extract 'from' query parameter from URL
  const urlObj = new URL(url, window.location.origin);
  const fromQuery = urlObj.searchParams.get('from');
  
  const returnUrl = getReturnUrl(fromQuery, userRole);
  const buttonLabel = returnUrl === '/my-messages/my-posts' 
    ? 'Kembali ke Pesan Saya' 
    : 'Kembali ke Pesan Publik';
  
  return { returnUrl, buttonLabel };
}





