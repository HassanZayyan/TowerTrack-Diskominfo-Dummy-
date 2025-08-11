import React, { useEffect } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertToastProps {
  show: boolean;
  type?: AlertType;
  title?: string;
  message?: string;
  durationMs?: number; // auto-hide after duration
  onClose?: () => void;
}

const typeToStyles: Record<AlertType, { bg: string; text: string; icon: string }>
  = {
    info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'info' },
    success: { bg: 'bg-green-50', text: 'text-green-700', icon: 'check_circle' },
    warning: { bg: 'bg-yellow-50', text: 'text-yellow-800', icon: 'warning' },
    error: { bg: 'bg-red-50', text: 'text-red-700', icon: 'error' },
  };

export default function AlertToast({
  show,
  type = 'info',
  title,
  message,
  durationMs = 3500,
  onClose,
}: AlertToastProps) {
  useEffect(() => {
    if (!show) return;
    if (!durationMs) return;
    const id = setTimeout(() => {
      onClose && onClose();
    }, durationMs);
    return () => clearTimeout(id);
  }, [show, durationMs, onClose]);

  const styles = typeToStyles[type];

  return (
    <div className={`fixed top-4 right-4 z-[60] transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
      <div className={`w-80 shadow-lg rounded-lg border ${styles.bg} ${styles.text} border-gray-200`}> 
        <div className="p-4 flex items-start gap-3">
          <span className={`material-icons-outlined mt-0.5 ${styles.text}`}>{styles.icon}</span>
          <div className="flex-1">
            {title && <div className="font-semibold mb-0.5">{title}</div>}
            {message && <div className="text-sm leading-relaxed">{message}</div>}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => onClose && onClose()}
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}


