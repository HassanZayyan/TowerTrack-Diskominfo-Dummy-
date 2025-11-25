import React from 'react';
import { MODAL_STYLES, getBackdropOpacity } from '@/utils/modalStyles';

interface ModalBackdropProps {
  onClick?: (e?: React.MouseEvent) => void;
  opacity?: number;
  blur?: boolean;
  zIndex?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable Modal Backdrop Component
 * DRY: Centralized modal backdrop styling and behavior
 * 
 * @param onClick - Handler untuk klik backdrop (biasanya untuk close modal)
 * @param opacity - Opacity backdrop (0-100, default: 50)
 * @param blur - Apakah backdrop harus blur (default: false)
 * @param zIndex - Z-index untuk backdrop (default: 50)
 * @param children - Modal content
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ModalBackdrop onClick={onClose} opacity={60} blur zIndex={50}>
 *   <ModalContainer>...</ModalContainer>
 * </ModalBackdrop>
 * ```
 */
export default function ModalBackdrop({
  onClick,
  opacity = MODAL_STYLES.opacity.medium,
  blur = false,
  zIndex = MODAL_STYLES.zIndex.modal,
  children,
  className = '',
}: ModalBackdropProps) {
  return (
    <div
      className={`${MODAL_STYLES.backdrop.base} ${blur ? 'backdrop-blur-sm' : ''} ${className}`}
      style={{
        backgroundColor: getBackdropOpacity(opacity),
        zIndex,
        overflow: MODAL_STYLES.backdrop.overflow,
        position: MODAL_STYLES.backdrop.position,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
      onClick={onClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

