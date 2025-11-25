import React, { ReactNode, useMemo, useState } from 'react';
import AnimatedButton from '@/Components/AnimatedButton';
import Modal from '@/Components/Modal';
import { useBodyScrollLock } from '@/Hooks/useBodyScrollLock';

type MessageActionDialogProps = {
  readonly triggerLabel: string;
  readonly triggerIcon?: ReactNode;
  readonly triggerVariant?: React.ComponentProps<typeof AnimatedButton>['variant'];
  readonly triggerSize?: React.ComponentProps<typeof AnimatedButton>['size'];
  readonly triggerAnimation?: React.ComponentProps<typeof AnimatedButton>['animation'];
  readonly triggerClassName?: string;
  readonly title: string;
  readonly description?: string;
  readonly maxWidth?: React.ComponentProps<typeof Modal>['maxWidth'];
  readonly showTrigger?: boolean;
  readonly triggerFullWidth?: boolean;
  readonly isOpen?: boolean;
  readonly setOpen?: (open: boolean) => void;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly children: (close: () => void) => ReactNode;
};

export default function MessageActionDialog({
  triggerLabel,
  triggerIcon,
  triggerVariant = 'primary',
  triggerSize = 'md',
  triggerAnimation = 'scale',
  triggerClassName,
  title,
  description,
  maxWidth = '2xl',
  showTrigger = true,
  triggerFullWidth = false,
  isOpen,
  setOpen,
  onOpen,
  onClose,
  children,
}: MessageActionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const resolvedOpen = useMemo(
    () => (typeof isOpen === 'boolean' ? isOpen : internalOpen),
    [isOpen, internalOpen],
  );

  const setResolvedOpen = (next: boolean) => {
    if (setOpen) {
      setOpen(next);
    } else {
      setInternalOpen(next);
    }
  };

  const handleOpen = () => {
    setResolvedOpen(true);
    onOpen?.();
  };

  const handleClose = () => {
    setResolvedOpen(false);
    onClose?.();
  };

  // Prevent body scroll saat modal terbuka
  useBodyScrollLock(resolvedOpen);

  return (
    <>
      {showTrigger && (
        <AnimatedButton
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          animation={triggerAnimation}
          fullWidth={triggerFullWidth}
          onClick={handleOpen}
          className={triggerClassName}
          icon={triggerIcon}
        >
          {triggerLabel}
        </AnimatedButton>
      )}

      <Modal show={resolvedOpen} onClose={handleClose} maxWidth={maxWidth}>
        <div className="flex h-full flex-col bg-white">
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 py-4 backdrop-blur flex-shrink-0">
            <div className="min-w-0 flex-1 pr-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 flex-shrink-0"
              aria-label="Tutup dialog"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div 
            className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 sm:pb-6"
            style={{
              minHeight: 0, // Penting untuk flex scrolling
              maxHeight: 'calc(100vh - 8rem)', // Mobile: kurangi untuk header dan padding
              WebkitOverflowScrolling: 'touch', // Smooth scrolling di mobile
              overscrollBehavior: 'contain' // Mencegah scroll chaining ke backdrop
            }}
          >
            {children(handleClose)}
          </div>
        </div>
      </Modal>
    </>
  );
}


