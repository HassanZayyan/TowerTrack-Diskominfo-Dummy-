import React from 'react';
import Modal from './Modal';
import { Button } from '@/Components/ui/button';

interface AlertDialogProps {
  show: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  show,
  onClose,
  type,
  title,
  message,
  confirmText = 'OK',
  onConfirm
}) => {
  // `warning` and `info` used to render in the retired brand red / raw blue-600.
  // Each tone now sits on its own semantic token set; only `error` stays red.
  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ),
          tileColor: 'bg-success-soft text-success-strong',
          textColor: 'text-success-strong',
          buttonVariant: 'success' as const,
          buttonClass: ''
        };
      case 'error':
        return {
          icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          tileColor: 'bg-destructive-soft text-destructive-strong',
          textColor: 'text-destructive-strong',
          buttonVariant: 'destructive' as const,
          buttonClass: ''
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          tileColor: 'bg-warning-soft text-warning-strong',
          textColor: 'text-warning-strong',
          buttonVariant: 'default' as const,
          buttonClass:
            'bg-warning text-warning-foreground hover:bg-warning-strong active:bg-warning-strong'
        };
      case 'info':
      default:
        return {
          icon: (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          tileColor: 'bg-info-soft text-info-strong',
          textColor: 'text-info-strong',
          buttonVariant: 'default' as const,
          buttonClass: ''
        };
    }
  };

  const { icon, tileColor, textColor, buttonVariant, buttonClass } = getIconAndColors();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="md" closeable={true}>
      <div className="p-6 bg-card">
        <div className="flex items-center justify-center mb-4">
          <div className={`rounded-full p-3 ${tileColor}`}>
            {icon}
          </div>
        </div>

        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>
            {title}
          </h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            size="lg"
            variant={buttonVariant}
            className={buttonClass}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;
