import React from 'react';
import { m } from 'motion/react';
import { getMaxWidthClass, MODAL_STYLES } from '@/utils/modalStyles';
import { panelVariants, useMotionPrefs } from '@/lib/motion';

interface ModalContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  maxHeight?: '85vh' | '90vh' | '95vh';
  rounded?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Reusable Modal Container Component
 * DRY: Centralized modal container styling
 * 
 * @param maxWidth - Maximum width dari modal (default: '2xl')
 * @param maxHeight - Maximum height dari modal (default: '90vh')
 * @param rounded - Border radius size (default: 'md')
 * @param children - Modal content
 * @param onClick - Click handler untuk container (biasanya untuk stopPropagation)
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ModalContainer maxWidth="2xl" maxHeight="90vh" onClick={(e) => e.stopPropagation()}>
 *   <div>Modal Content</div>
 * </ModalContainer>
 * ```
 */
export default function ModalContainer({
  maxWidth = '2xl',
  maxHeight = '90vh',
  rounded = 'md',
  children,
  onClick,
  className = '',
}: ModalContainerProps) {
  const roundedClass = MODAL_STYLES.container.rounded[rounded];
  const maxWidthClass = getMaxWidthClass(maxWidth);
  const { reduce } = useMotionPrefs();

  // Map maxHeight to Tailwind classes
  const maxHeightClass = {
    '85vh': 'max-h-[85vh]',
    '90vh': 'max-h-[90vh]',
    '95vh': 'max-h-[95vh]',
  }[maxHeight] || 'max-h-[90vh]';

  // The panel rises and scales while the scrim behind it only fades, which is
  // what separates the two planes. Scale is 0.97, not 0.9 — a dialog that grows
  // noticeably reads as a notification popping up rather than as a surface
  // being brought forward. Exit is ~0.7x enter, per the codebase contract.
  //
  // Requires an `AnimatePresence` at the call site to play the exit; see the
  // note in ModalBackdrop.
  return (
    <m.div
      className={`${MODAL_STYLES.container.base} ${maxWidthClass} ${maxHeightClass} w-full ${roundedClass} ${className}`}
      variants={panelVariants}
      initial={reduce ? false : 'hidden'}
      animate="visible"
      exit={reduce ? undefined : 'exit'}
      onClick={onClick}
    >
      {children}
    </m.div>
  );
}

