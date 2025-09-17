import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = 'flex items-center p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`${getToastStyles()} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {getIcon()}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-3 flex-shrink-0 hover:opacity-70 focus:outline-none"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Toast container component
export const ToastContainer: React.FC = () => {
  const { props } = usePage();
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  useEffect(() => {
    // Check for flash messages from Laravel
    const flashMessages = props as any;
    
    if (flashMessages.success) {
      addToast(flashMessages.success, 'success');
    }
    if (flashMessages.error) {
      addToast(flashMessages.error, 'error');
    }
    if (flashMessages.warning) {
      addToast(flashMessages.warning, 'warning');
    }
    if (flashMessages.info) {
      addToast(flashMessages.info, 'info');
    }
  }, [props]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
