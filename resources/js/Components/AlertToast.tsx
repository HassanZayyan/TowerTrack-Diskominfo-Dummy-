import React, { useEffect } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { toastVariants, useMotionPrefs } from '@/lib/motion';
import { cn } from '@/lib/utils';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertToastProps {
  show: boolean;
  type?: AlertType;
  title?: string;
  message?: string;
  durationMs?: number; // auto-hide after duration
  onClose?: () => void;
}

/**
 * The transient status toast on the public pages.
 *
 * TWO BUGS THIS FIXES, AND THEY ARE BOTH FAMILIAR.
 *
 * 1. It never animated. The class list was `transition-colors duration-300`
 *    while the component toggled `opacity-100 translate-y-0` against
 *    `opacity-0 -translate-y-2`. `transition-colors` transitions colour,
 *    background, border, fill and stroke — and nothing else. Opacity and
 *    transform therefore snapped, and the 300ms applied to no property at all.
 *    This is the exact bug `StaggeredContainer.tsx` documents having fixed in
 *    itself; it simply survived here.
 *
 * 2. It was never unmounted. Hidden meant `opacity-0 pointer-events-none`, so
 *    the toast markup sat in the DOM on every page at all times. Invisible to
 *    the eye, present to a screen reader, and permanently occupying the corner
 *    for hit-testing purposes until `pointer-events-none` was remembered.
 *
 * Now `AnimatePresence` owns presence, so the element genuinely leaves and its
 * exit actually plays. `role="status"` with a polite live region means the
 * message is announced when it arrives rather than being read out of the page's
 * furniture.
 *
 * The palette was also off-system: `bg-green-50`, `text-yellow-800`,
 * `text-red-700` are stock Tailwind, from before the token migration. Replaced
 * with the semantic families, following the house contract — the bare token is
 * a FILL, `-soft` is the tinted ground, `-strong` is the text and icon colour.
 */

const typeToStyles: Record<AlertType, { surface: string; icon: string }> = {
  info: { surface: 'bg-info-soft border-info-border text-info-strong', icon: 'info' },
  success: { surface: 'bg-success-soft border-success-border text-success-strong', icon: 'check_circle' },
  warning: { surface: 'bg-warning-soft border-warning-border text-warning-strong', icon: 'warning' },
  error: { surface: 'bg-destructive-soft border-destructive-border text-destructive-strong', icon: 'error' },
};

export default function AlertToast({
  show,
  type = 'info',
  title,
  message,
  durationMs = 3500,
  onClose,
}: AlertToastProps) {
  const { reduce } = useMotionPrefs();

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
    <AnimatePresence>
      {show && (
        <m.div
          key="alert-toast"
          className="fixed right-4 top-4 z-[60]"
          variants={toastVariants}
          initial={reduce ? false : 'hidden'}
          animate="visible"
          exit={reduce ? undefined : 'exit'}
          role="status"
          aria-live="polite"
        >
          <div className={cn('w-80 rounded-lg border shadow-lg', styles.surface)}>
            <div className="flex items-start gap-3 p-4">
              <span className="material-icons-outlined mt-0.5" aria-hidden="true">
                {styles.icon}
              </span>
              <div className="flex-1">
                {title && <div className="mb-0.5 font-semibold">{title}</div>}
                {message && <div className="text-sm leading-relaxed">{message}</div>}
              </div>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                className="rounded text-muted-foreground transition-colors duration-140 ease-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                onClick={() => onClose && onClose()}
              >
                <span className="material-icons-outlined" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
