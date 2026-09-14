import React from 'react';
import { m } from 'motion/react';
import { MODAL_STYLES, getBackdropOpacity } from '@/utils/modalStyles';
import { scrimVariants, useMotionPrefs } from '@/lib/motion';

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
 * ANIMATION, AND THE CONTRACT IT PLACES ON CALL SITES.
 *
 * This scrim used to be a plain `<div>`, so the ten modals built on it had no
 * enter and — more visibly — no exit at all: dismissing one cut it out of the
 * frame between two paints. It is a motion element now, fading with the
 * `scrimVariants` timing every other surface uses.
 *
 * An exit animation cannot work on its own. React unmounts a component the
 * instant its condition goes false, so something has to hold the tree alive
 * long enough to play the leave. That something is `AnimatePresence`, and it
 * has to sit at the CALL SITE, wrapping the conditional:
 *
 *     <AnimatePresence>
 *       {open && (
 *         <ModalBackdrop onClick={close}>
 *           <ModalContainer>...</ModalContainer>
 *         </ModalBackdrop>
 *       )}
 *     </AnimatePresence>
 *
 * Keeping the conditional inside `AnimatePresence` rather than passing an
 * `open` prop is deliberate: several of these modals render `thing.name` from
 * the state that is being cleared, and only a conditional that stops evaluating
 * its children keeps that from throwing on the way out.
 *
 * The scrim never scales and never moves — it is the surface the dialog is
 * layered over, and a scrim that animates in two dimensions reads as a second
 * dialog rather than as depth.
 *
 * @param onClick - Handler untuk klik backdrop (biasanya untuk close modal)
 * @param opacity - Opacity backdrop (0-100, default: 50)
 * @param blur - Apakah backdrop harus blur (default: false)
 * @param zIndex - Z-index untuk backdrop (default: 50)
 * @param children - Modal content
 * @param className - Additional CSS classes
 */
export default function ModalBackdrop({
  onClick,
  opacity = MODAL_STYLES.opacity.medium,
  blur = false,
  zIndex = MODAL_STYLES.zIndex.modal,
  children,
  className = '',
}: ModalBackdropProps) {
  const { reduce } = useMotionPrefs();

  return (
    <m.div
      className={`${MODAL_STYLES.backdrop.base} ${blur ? 'backdrop-blur-sm' : ''} ${className}`}
      variants={scrimVariants}
      // Reduced motion still mounts and unmounts correctly; it just arrives and
      // leaves instantly. `initial={false}` skips the enter state rather than
      // playing it at zero duration, which avoids a one-frame flash.
      initial={reduce ? false : 'hidden'}
      animate="visible"
      exit={reduce ? undefined : 'exit'}
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
    </m.div>
  );
}
