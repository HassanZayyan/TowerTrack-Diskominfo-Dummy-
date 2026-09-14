import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  showLogo?: boolean;
  logoPath?: string;
  /** @deprecated Ignored — the header is a rule, not a coloured panel. */
  backgroundColor?: string;
  className?: string;
  /** Buttons or filters aligned to the right of the title. */
  actions?: React.ReactNode;
}

/**
 * Page header.
 *
 * Was a cream `#FFF8E1` panel with a shadow and a floating logo — a coloured
 * card whose only job was to hold a string. In the shadcn register a page
 * header is type plus a hairline rule: the title is the largest thing on the
 * screen, so it needs no container to be found.
 *
 * `backgroundColor` is kept in the props so the existing call sites compile,
 * but it is ignored. `actions` is new, and is where page-level buttons belong
 * instead of being scattered above the content.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Form Masukan"
 *   description="Silakan isi form di bawah ini untuk menyampaikan masukan atau saran"
 *   actions={<Button>Simpan</Button>}
 * />
 * ```
 */
export default function PageHeader({
  title,
  description,
  showLogo = true,
  logoPath = '/images/kab-smg-logo.webp',
  className = '',
  actions,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-3 border-b border-border pb-5',
        'sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showLogo && (
          <img
            src={logoPath}
            alt=""
            className="h-9 w-9 shrink-0 object-contain hidden xs:block"
          />
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
