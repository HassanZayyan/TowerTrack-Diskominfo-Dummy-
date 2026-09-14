/**
 * FormField — the standard admin form control.
 *
 * REBUILT. What was removed and why:
 *  - `colorClasses`: a 5-key map (red/blue/green/yellow/purple) of raw palette
 *    strings — focus:ring-red-100, focus:border-green-500, text-yellow-600,
 *    border-red-300, text-red-500. A form field does not have a mood. One field
 *    recipe, tokens only: border-input at rest, border-ring on focus,
 *    border-destructive + destructive-strong text when invalid.
 *    `colorScheme` stays in the signature so no call site has to change; it is
 *    deliberately ignored.
 *  - `border-2 rounded-xl px-4 py-3 focus:ring-4`: a 2px border and a 4px halo
 *    on every input is what made forms read as a stack of pill-shaped cards.
 *    1px border, rounded-md, the one 3px focus ring the token layer defines.
 *  - the duplicated icon (it rendered inside the label AND as a trailing
 *    adornment): the icon is now a single leading adornment inside the control.
 *
 * Controls are 44px tall (h-11) so they clear the touch-target floor, and every
 * one of them is wired for assistive tech: htmlFor/id, aria-invalid,
 * aria-describedby pointing at the error, role="alert" on the message.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'url' | 'email' | 'password';
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  step?: string;
  min?: number;
  max?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  showIcon?: boolean;
  /** @deprecated A form field has no colour scheme. Accepted and ignored. */
  colorScheme?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
}

/** Shared by input, select and textarea so the three can never drift apart. */
const controlBase = cn(
  'w-full rounded-md border bg-background text-sm text-foreground',
  'placeholder:text-placeholder',
  'transition-colors duration-140 ease-state',
  'focus:outline-none focus-visible:outline-none focus:border-ring focus:ring',
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70',
);

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  icon,
  className = '',
  inputClassName = '',
  disabled = false,
  step,
  min,
  max,
  rows,
  options,
  showIcon = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  colorScheme,
}) => {
  const errorId = `${name}-error`;
  const hasAdornment = showIcon && Boolean(icon);

  const stateClasses = error
    ? 'border-destructive focus:border-destructive'
    : 'border-input hover:border-border-strong';

  const renderAdornment = () =>
    hasAdornment ? (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"
      >
        {icon}
      </span>
    ) : null;

  const renderControl = () => {
    /* SELECT ------------------------------------------------------------- */
    if (options) {
      return (
        <div className="relative">
          {renderAdornment()}
          <select
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              controlBase,
              stateClasses,
              'h-11 appearance-none pr-9',
              hasAdornment ? 'pl-9' : 'pl-3',
              inputClassName,
            )}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-placeholder"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      );
    }

    /* TEXTAREA ----------------------------------------------------------- */
    if (rows) {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(controlBase, stateClasses, 'min-h-[88px] resize-y px-3 py-2.5 leading-relaxed', inputClassName)}
        />
      );
    }

    /* INPUT -------------------------------------------------------------- */
    return (
      <div className="relative">
        {renderAdornment()}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            controlBase,
            stateClasses,
            'h-11 pr-3',
            type === 'number' ? 'tabular-nums' : '',
            hasAdornment ? 'pl-9' : 'pl-3',
            inputClassName,
          )}
        />
      </div>
    );
  };

  return (
    <div className={cn('min-w-0', className)}>
      {/* Label -> control is 6px: they are one unit. */}
      <label
        htmlFor={name}
        className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-foreground"
      >
        {/* Indonesian labels run long ("Ketersediaan Koordinat"); truncate with a
            title rather than letting the column clip it. */}
        <span className="min-w-0 flex-1 truncate" title={label}>
          {label}
        </span>
        {required && (
          <span className="font-semibold text-destructive-strong" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(wajib diisi)</span>}
      </label>

      {renderControl()}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive-strong"
        >
          <svg className="mt-px h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="min-w-0">{error}</span>
        </p>
      )}
    </div>
  );
};

export default FormField;
