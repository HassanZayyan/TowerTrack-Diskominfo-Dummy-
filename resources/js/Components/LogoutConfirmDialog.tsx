import React from 'react';
import { Button } from '@/Components/ui/button';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Logout',
  message = 'Apakah Anda yakin ingin keluar dari sistem?',
  confirmText = 'Ya, Logout',
  cancelText = 'Batal',
  variant = 'default'
}) => {
  if (!isOpen) return null;

  // Tone per variant. All three branches used to render the retired brand red
  // (the #B71C1C family). Red now means destructive only, so `default` moves to
  // the primary tokens, `warning` to amber, and only `danger` stays red.
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return {
          tile: 'bg-destructive-soft text-destructive-strong',
          title: 'text-destructive-strong',
          confirmVariant: 'destructive' as const,
          confirmClass: '',
        };
      case 'warning':
        return {
          tile: 'bg-warning-soft text-warning-strong',
          title: 'text-warning-strong',
          confirmVariant: 'default' as const,
          confirmClass:
            'bg-warning text-warning-foreground hover:bg-warning-strong active:bg-warning-strong',
        };
      default:
        return {
          tile: 'bg-primary-soft text-primary-strong',
          title: 'text-foreground',
          confirmVariant: 'default' as const,
          confirmClass: '',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-md overflow-hidden rounded-lg border border-border shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.tile}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${colors.title}`}>{title}</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 mt-0.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={colors.confirmVariant}
            className={colors.confirmClass}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmDialog;
