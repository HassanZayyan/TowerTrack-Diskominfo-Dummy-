/**
 * ProviderSelection — multi-select list of providers for an FO point.
 *
 * REBUILT. The colour-scheme concept is GONE.
 * The previous version carried a 4-key map (purple/red/amber/stone) x 10 keys of
 * raw palette strings: `bg-destructive-soft a
 * `bg-warning-soft icon tile, `text-stone-900`,
 * `focus-visible:ring`, plus two dead entries (`bg: ''` and
 * `dialogButton: 'hover:hover:'`). It meant the same control rendered purple on
 * one page and red on another for no reason a user could name, and 60 of the
 * file's classes bypassed the token layer.
 *
 * Now: one neutral list. Selection is carried by the brand — a checked row gets
 * bg-selected + border-primary-border + a medium weight label — so"which ones
 * are on" is answerable at a glance without a palette per page.
 *
 * `colorScheme` and `useBackdropBlur` remain in the signature so PointCreate.tsx
 * and PointEdit.tsx keep compiling; both are deliberately ignored.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface Provider {
  id: number;
  name: string;
}

interface ProviderSelectionProps {
  providers: number[];
  availableProviders: Provider[];
  onChange: (providers: number[]) => void;
  errors?: string | string[];
  /** @deprecated The control is neutral. Accepted and ignored. */
  colorScheme?: 'purple' | 'red' | 'amber' | 'stone';
  label?: string;
  /** @deprecated Glass panels are gone. Accepted and ignored. */
  useBackdropBlur?: boolean;
}

export default function ProviderSelection({
  providers = [],
  availableProviders = [],
  onChange,
  errors,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  colorScheme,
  label = 'Pilih Provider',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useBackdropBlur,
}: ProviderSelectionProps) {
  // Handle checkbox change
  const handleProviderCheckboxChange = (providerId: number, checked: boolean) => {
    const currentProviders = providers || [];
    if (checked) {
      onChange([...currentProviders, providerId]);
    } else {
      onChange(currentProviders.filter((id) => id !== providerId));
    }
  };

  const errorMessage = errors ? (typeof errors === 'string' ? errors : errors[0]) : undefined;
  const selectedCount = providers?.length ?? 0;

  return (
    <div
      role="group"
      aria-labelledby="providers-label"
      aria-describedby={errorMessage ? 'providers-error' : undefined}
      className="min-w-0"
    >
      {/* Title + the one description line. The old version said"optional"
          three times: a heading subtitle, an"(Opsional)" chip on the label, and
          a closing helper paragraph. One statement is enough. */}
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span id="providers-label" className="min-w-0 truncate text-sm font-medium text-foreground" title={label}>
          {label}
        </span>
        <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount} dipilih` : 'Belum ada yang dipilih'}
        </span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        (Opsional - bisa pilih lebih dari satu atau tidak memilih sama sekali)
      </p>

      {/* Rows carry the rhythm; the frame is a hairline, not a 2px pill. */}
      <div
        className={cn(
          'max-h-64 divide-y divide-border/70 overflow-y-auto rounded-md border bg-card',
          errorMessage ? 'border-destructive' : 'border-border',
        )}
      >
        {availableProviders && availableProviders.length > 0 ? (
          availableProviders.map((provider) => {
            const checked = providers.includes(provider.id);
            return (
              <label
                key={provider.id}
                className={cn(
                  // 44px row: touch target and list rhythm in one number.
                  'flex min-h-[44px] cursor-pointer items-center gap-3 px-3 py-2',
                  'transition-colors duration-140 ease-state',
                  'focus-within:bg-accent',
                  checked ? 'bg-selected' : 'hover:bg-accent',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => handleProviderCheckboxChange(provider.id, e.target.checked)}
                  className="h-4 w-4 flex-shrink-0 rounded border-input text-primary focus:outline-none focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                />
                {/* Provider names are short, but truncate + title anyway so a
                    long one never clips silently. */}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    checked ? 'font-medium text-selected-foreground' : 'text-foreground',
                  )}
                  title={provider.name}
                >
                  {provider.name}
                </span>
              </label>
            );
          })
        ) : (
          <p className="bg-well px-3 py-6 text-center text-sm text-muted-foreground">
            Tidak ada provider tersedia
          </p>
        )}
      </div>

      {errorMessage && (
        <p
          id="providers-error"
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive-strong"
        >
          <svg className="mt-px h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="min-w-0">{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
