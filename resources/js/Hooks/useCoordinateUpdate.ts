/**
 * Custom hook for handling coordinate updates via drag-and-drop
 * DRY: Reusable coordinate update logic for PointEdit and RouteEdit
 */

import { useState } from 'react';

interface UseCoordinateUpdateOptions {
  routeUrl: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface CoordinateUpdateState {
  isUpdating: boolean;
  message: string | null;
  messageType: 'success' | 'error' | null;
}

export const useCoordinateUpdate = ({ routeUrl, onSuccess, onError }: UseCoordinateUpdateOptions) => {
  const [state, setState] = useState<CoordinateUpdateState>({
    isUpdating: false,
    message: null,
    messageType: null,
  });

  const updateCoordinates = async (latitude: number, longitude: number) => {
    setState({
      isUpdating: true,
      message: null,
      messageType: null,
    });

    try {
      // Ensure CSRF token is set
      const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
      }
      
      const response = await window.axios.patch(routeUrl, {
        latitude,
        longitude,
      });

      if (response.data && response.data.success) {
        const successMessage = 'Koordinat berhasil diperbarui. GeoJSON akan di-regenerate saat route di-load.';
        setState({
          isUpdating: false,
          message: successMessage,
          messageType: 'success',
        });
        
        if (onSuccess) {
          onSuccess(successMessage);
        }
        
        // Auto-clear message after 5 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, message: null, messageType: null }));
        }, 5000);
      } else {
        const errorMessage = 'Gagal memperbarui koordinat. Silakan coba lagi.';
        setState({
          isUpdating: false,
          message: errorMessage,
          messageType: 'error',
        });
        
        if (onError) {
          onError(errorMessage);
        }
        
        setTimeout(() => {
          setState(prev => ({ ...prev, message: null, messageType: null }));
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error updating coordinates:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat memperbarui koordinat.';
      
      setState({
        isUpdating: false,
        message: errorMessage,
        messageType: 'error',
      });
      
      if (onError) {
        onError(errorMessage);
      }
      
      setTimeout(() => {
        setState(prev => ({ ...prev, message: null, messageType: null }));
      }, 5000);
    }
  };

  const clearMessage = () => {
    setState(prev => ({ ...prev, message: null, messageType: null }));
  };

  return {
    isUpdating: state.isUpdating,
    message: state.message,
    messageType: state.messageType,
    updateCoordinates,
    clearMessage,
  };
};

