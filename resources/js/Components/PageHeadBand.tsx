import React from 'react';
import { cn } from '@/lib/utils';

export interface HeadStat {
  /** Short label, e.g. "Menara terdata". */
  label: string;
  value: React.ReactNode;
  /** Optional qualifier shown under the figure, e.g. "dari 168". */
  note?: string;
  /** 0–1. Draws a composition rule under the figure. Omit when there is no
   *  honest denominator — a bar with an invented total is worse than no bar. */
  share?: number;
  /** Rule colour. Defaults to the brand. */
  accent?: string;
}

interface PageHeadBandProps {
  title: string;
  subtitle?: string;
  /** Search or primary control, rendered under the title. */
  action?: React.ReactNode;
  stats?: HeadStat[];
  /** Rendered at the far right of the title row. */
  aside?: React.ReactNode;
  className?: string;
}

/**
 * The band that replaces the hero on data pages.
 *
 * The hero it replaces was 474px tall and held a headline, one line of subtitle
 * and two buttons — on /data-tower the Leaflet canvas, which is the subject of
 * the page, did not begin until 807px, leaving the map 14% of a 1080p screen.
 *
 * Two references decide the shape. Portal Satu Data Indonesia (data.go.id) runs
 * its hero at `pt-14 pb-4` — 72px, not 600 — as a two-column split with the
 * STATISTICS AS THE RIGHT COLUMN, which is what lets the stat band stop being a
 * separate section. ANFR Cartoradio (cartoradio.fr) collapses its institutional
 * header from 160px to 70px the moment the route becomes a map. Cloudscape
 * states the rule outright: do not use a hero header where users need to
 * perform a task or work with large amounts of data.
 *
 * The dot grid is the one texture allowance. The regency's own PPID property
 * uses the same device, so it reads as an institutional cue rather than as
 * decoration, and it is masked to fade out before it reaches the type.
 */
export default function PageHeadBand({
  title,
  subtitle,
  action,
  stats,
  aside,
  className = '',
}: PageHeadBandProps) {
  return (
    <section className={cn('relative border-b border-border bg-canvas', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: 'radial-gradient(hsl(var(--border-strong)) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          maskImage: 'linear-gradient(to bottom, rgb(0 0 0 / 0.5), transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgb(0 0 0 / 0.5), transparent 70%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0 lg:max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
                {title}
              </h1>
              {aside && <div className="shrink-0 lg:hidden">{aside}</div>}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{subtitle}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
          </div>

          {stats && stats.length > 0 && (
            <div
              className={cn(
                'grid w-full gap-px overflow-hidden rounded-lg border border-border bg-border lg:w-auto lg:shrink-0',
                stats.length >= 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-1 xs:grid-cols-3',
              )}
            >
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="tt-enter-up min-w-0 bg-card p-3 lg:min-w-[8.5rem]"
                  style={{ '--tt-delay': `${i * 40}ms` } as React.CSSProperties}
                >
                  <div className="text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                    {s.value}
                  </div>
                  {typeof s.share === 'number' && (
                    <div className="mt-2 h-1 w-12 overflow-hidden rounded-full bg-border">
                      <div
                        className="animate-bar-grow h-full origin-left rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(1, s.share)) * 100}%`,
                          backgroundColor: s.accent ?? 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  )}
                  <div className="mt-2 truncate text-xs font-medium leading-tight text-muted-foreground">
                    {s.label}
                  </div>
                  {s.note && (
                    <div className="mt-0.5 text-xs leading-tight text-placeholder">{s.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {aside && <div className="hidden shrink-0 lg:block">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
