/**
 * Utility functions for handling private message requirements
 * DRY: Shared logic for private message authentication checks
 */

import { router } from '@inertiajs/react';

interface FormState {
  form: Record<string, any>;
  files?: File[];
  type: 'complaint' | 'feedback';
}

/**
 * Handle private message selection for guest users
 * Redirects to register if user is not authenticated
 * 
 * @param isAuthenticated - Whether user is authenticated
 * @param currentPath - Current page path
 * @param formState - Current form state to restore later
 */
export const handlePrivateSelection = (
  isAuthenticated: boolean,
  currentPath: string,
  formState: FormState
): boolean => {
  // If user is authenticated, allow private selection
  if (isAuthenticated) {
    return true;
  }

  // Guest user trying to select private - save form state and redirect
  try {
    sessionStorage.setItem('pendingForm', JSON.stringify({
      ...formState,
      timestamp: Date.now(),
    }));
    
    // Build register URL with query parameters
    const registerUrl = `/register?return_to=${encodeURIComponent(currentPath)}&select_private=true`;
    
    // Redirect to register with return URL
    router.visit(registerUrl);
  } catch (error) {
    console.error('Error saving form state:', error);
    // Fallback: redirect without saving state
    const registerUrl = `/register?return_to=${encodeURIComponent(currentPath)}&select_private=true`;
    router.visit(registerUrl);
  }

  return false; // Prevent form state change
};

/**
 * Restore form state from sessionStorage after login/register
 * 
 * @returns FormState | null - Restored form state or null if not found
 */
export const restoreFormState = (): FormState | null => {
  try {
    const savedState = sessionStorage.getItem('pendingForm');
    if (!savedState) {
      return null;
    }

    const formData = JSON.parse(savedState);
    
    // Check if state is not too old (max 1 hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (formData.timestamp && Date.now() - formData.timestamp > maxAge) {
      sessionStorage.removeItem('pendingForm');
      return null;
    }

    // Remove from storage after reading
    sessionStorage.removeItem('pendingForm');
    
    return {
      form: formData.form || {},
      files: formData.files || [],
      type: formData.type || 'complaint',
    };
  } catch (error) {
    console.error('Error restoring form state:', error);
    sessionStorage.removeItem('pendingForm');
    return null;
  }
};

/**
 * Check if private should be auto-selected after login/register
 * 
 * @returns boolean - Whether to auto-select private
 */
export const shouldSelectPrivate = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('select_private') === 'true';
};

