import React from 'react';
import { cn } from '@/lib/utils';

interface StaggeredContainerProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  animationType?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  hoverEffect?: boolean;
}

/**
 * Entrance animation for a block of content.
 *
 * TWO BUGS THIS FIXES.
 *
 * 1. It never animated. The class list was `transition-colors` while the
 *    component toggled `opacity-0 translate-y-8` → `opacity-100 translate-y-0`.
 *    `transition-colors` transitions colour/background/border/fill/stroke and
 *    nothing else, so opacity and transform snapped, and the inline
 *    `transitionDuration: 300ms` applied to no property at all. All nine call
 *    sites popped.
 *
 * 2. It was gated on IntersectionObserver, so content sat at `opacity-0` until
 *    it was scrolled into view. On the public pages that meant the stat tiles
 *    and the map were invisible in the first painted frame — the frame a
 *    thumbnail, a shared link and an impatient reader all get. Scroll-triggered
 *    reveals of ordinary body content are a tell, not a feature.
 *
 * Now: a CSS keyframe that runs once on mount, offset by `delay`. No observer,
 * no scroll coupling, and compositor-only properties (transform + opacity) so
 * it does not thrash layout on a mid-range Android.
 */
const ANIMATION: Record<NonNullable<StaggeredContainerProps['animationType']>, string> = {
  fadeInUp: 'tt-enter-up',
  fadeInLeft: 'tt-enter-left',
  fadeInRight: 'tt-enter-right',
  scaleIn: 'tt-enter-scale',
};

const StaggeredContainer: React.FC<StaggeredContainerProps> = ({
  children,
  delay = 0,
  duration = 260,
  className = '',
  animationType = 'fadeInUp',
  hoverEffect = false,
}) => {
  return (
    <div
      className={cn(ANIMATION[animationType], hoverEffect && 'transition-shadow duration-140 hover:shadow-md', className)}
      style={
        {
          '--tt-delay': `${delay}ms`,
          '--tt-duration': `${duration}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default StaggeredContainer;
