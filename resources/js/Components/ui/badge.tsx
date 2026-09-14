import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Status chip.
 *
 * Each semantic variant is a SOFT fill plus a `-strong` text colour plus a
 * border — never the bare fill token with white text at this size, because a
 * 12px label on a saturated ground is the hardest thing on the page to read.
 *
 * `warning` carries an explicit border because amber is 2.15:1 against white
 * and fails SC 1.4.11 as a bare graphical object.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary-border bg-primary-soft text-primary-strong',
        secondary: 'border-border bg-muted text-muted-foreground',
        success: 'border-success-border bg-success-soft text-success-strong',
        warning: 'border-warning-border bg-warning-soft text-warning-strong',
        destructive: 'border-destructive-border bg-destructive-soft text-destructive-strong',
        info: 'border-info-border bg-info-soft text-info-strong',
        neutral: 'border-neutral-border bg-neutral-soft text-neutral-strong',
        outline: 'border-input bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
