import React from 'react';
import { cn } from '@/lib/utils';

// Type definitions - simplified and more focused
type HeroVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'info';
type HeroAlign = 'center' | 'left';

interface HeroSectionProps {
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly variant?: HeroVariant;
  readonly align?: HeroAlign;
  readonly className?: string;
  /** Illustration for the right column. NOT a background any more — see below. */
  readonly backgroundImage?: string;
  /** Drawn illustration for the right column. Takes precedence over `backgroundImage`. */
  readonly art?: React.ReactNode;
  readonly fullScreen?: boolean;
  /** Small pill above the title, e.g. "Kabupaten Semarang". */
  readonly eyebrow?: React.ReactNode;
}

/**
 * Hero band.
 *
 * WHY THERE IS NO COLOURED BACKGROUND.
 *
 * Every earlier attempt gave the hero a ground of its own — a red gradient,
 * then a photo under an 80% brand scrim — and each one left a visible seam
 * where the band met the page. That seam is not a colour-matching problem you
 * can solve by choosing a better red: two different grounds meeting will always
 * show a join, and a scrim dark enough to carry white text is by definition
 * darker than any light page beneath it.
 *
 * So the band now shares the page's own ground (`--canvas`) and the type is
 * dark. There is nothing to harmonise because there is only one surface. This
 * is the data.go.id arrangement — headline and actions on the left, the artwork
 * as a contained element on the right rather than bleeding behind the text.
 *
 * `backgroundImage` keeps its name so the existing call sites still compile,
 * but it is now the right-column illustration. It is also why no new asset was
 * needed: the existing PNGs are warm red-orange illustrations, and a warm stone
 * page is the one ground they sit on without fighting it.
 */
const EYEBROW_CLASSES = {
  brand: 'border-primary-border bg-primary-soft text-primary-strong',
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-success-border bg-success-soft text-success-strong',
  warning: 'border-warning-border bg-warning-soft text-warning-strong',
  info: 'border-info-border bg-info-soft text-info-strong',
} as const;

const HeroSection: React.FC<HeroSectionProps> = React.memo<HeroSectionProps>((
  {
    title,
    subtitle,
    actions,
    variant = 'brand',
    align = 'left',
    className = '',
    backgroundImage,
    art,
    fullScreen = false,
    eyebrow,
  }
): JSX.Element => {
  const hasArt = Boolean(art || backgroundImage);
  const isCenter = align === 'center' && !hasArt;

  return (
    <section className={cn('relative overflow-hidden border-b border-border bg-canvas', className)}>
      {/* The dot device the regency's own PPID property uses — verified in its
          stylesheet as radial-gradient(#d5d5d5 1px, transparent 1px). Masked so
          it never reaches the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(hsl(var(--border-strong)) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          maskImage: 'radial-gradient(120% 85% at 78% 18%, rgb(0 0 0 / 0.6), transparent 68%)',
          WebkitMaskImage: 'radial-gradient(120% 85% at 78% 18%, rgb(0 0 0 / 0.6), transparent 68%)',
        }}
      />

      <div
        className={cn(
          'relative mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10',
          fullScreen ? 'py-14 sm:py-20' : 'py-10 sm:py-14',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-8',
            hasArt && 'lg:flex-row lg:items-center lg:justify-between lg:gap-12',
          )}
        >
          <div className={cn('min-w-0', hasArt && 'lg:max-w-xl', isCenter && 'mx-auto text-center')}>
            {eyebrow && (
              <div className={cn(isCenter && 'flex justify-center')}>
                <span
                  className={cn(
                    'tt-enter-up inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide',
                    EYEBROW_CLASSES[variant],
                  )}
                >
                  {eyebrow}
                </span>
              </div>
            )}

            <h1
              className={cn(
                'tt-enter-up text-balance font-bold tracking-tight text-foreground',
                'text-3xl sm:text-4xl lg:text-5xl',
                eyebrow && 'mt-4',
              )}
              style={{ '--tt-delay': '60ms' } as React.CSSProperties}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className={cn(
                  'tt-enter-up mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg',
                  isCenter && 'mx-auto',
                )}
                style={{ '--tt-delay': '120ms' } as React.CSSProperties}
              >
                {subtitle}
              </p>
            )}

            {actions && (
              <div
                className={cn(
                  'tt-enter-up mt-6 flex flex-col gap-3 sm:flex-row',
                  isCenter && 'justify-center',
                )}
                style={{ '--tt-delay': '180ms' } as React.CSSProperties}
              >
                {actions}
              </div>
            )}
          </div>

          {hasArt && (
            <div
              className="tt-enter-right relative w-full shrink-0 lg:w-[46%]"
              style={{ '--tt-delay': '120ms', '--tt-duration': '320ms' } as React.CSSProperties}
            >
              {/* `art` wins over `backgroundImage` when both are given.
                  The two public data pages pass a drawing now instead of a
                  photograph; it needs no frame and no hairline, because it is
                  made of the page's own tokens and already sits on the page's
                  own ground. See Components/HeroIsoArt.tsx. */}
              {art ?? (
                <>
                  <img
                    src={backgroundImage}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="h-48 w-full rounded-lg object-cover sm:h-60 lg:h-72"
                  />
                  {/* The illustrations are bright; a hairline settles them onto the
                      stone ground without dimming them the way a scrim would. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-border"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

// Set display name for better debugging experience
HeroSection.displayName = 'HeroSection';

// Export with proper TypeScript annotations
export default HeroSection;
export type { HeroSectionProps, HeroVariant, HeroAlign };
