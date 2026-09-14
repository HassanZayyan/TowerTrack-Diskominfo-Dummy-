import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Surface primitive.
 *
 * WHY THIS HAS VARIANTS NOW. The previous version hardcoded one string —
 * `rounded-lg border border-border bg-card shadow-xs` — and it was applied at
 * all 55 <Card> sites. A 104px stat tile and a 600px data table rendered
 * byte-identical chrome, so nothing on any page read as more important than
 * anything else. That is the actual cause of "terlalu flat"; it was never a
 * shortage of effects.
 *
 * THREE GROUNDS, and three is the ceiling — a fourth reads as noise:
 *   canvas  #FAFAF9  the page
 *   card    #FFFFFF  raised content
 *   well    #F0EEEB  inset content (table headers, rails, empty states)
 *
 * A well is DARKER than its parent and carries an inset highlight. A raised
 * surface is lighter and gets a shadow only when it overlaps something. Never
 * a shadow without the lighter surface; never a raised surface sitting flat.
 */
const cardVariants = cva('rounded-lg', {
    variants: {
        variant: {
            /** Default content surface. */
            default: 'border border-border bg-card text-card-foreground shadow-xs',
            /** The one block that is the subject of its page — the map. */
            primary: 'border border-border bg-card text-card-foreground shadow-md',
            /** Inset. Recessed, no outer shadow — depth comes from being darker. */
            well: 'border border-border bg-well text-foreground shadow-[inset_0_1px_0_rgb(28_25_23/0.04)]',
            /** Grouped rows: the container is a frame, the rows carry the rhythm. */
            flat: 'border border-border bg-card text-card-foreground',
            /** Sits on the brand band. */
            onBrand: 'border border-white/15 bg-white/10 text-white backdrop-blur-[2px]',
            /** Carries a status. The rail colour is passed via className. */
            accent: 'border border-border bg-card text-card-foreground shadow-xs border-l-2',
        },
        padding: {
            /** list rows, chips, compact widgets, rails */
            dense: 'p-3',
            /** table shells, map shell, form cards */
            default: 'p-5',
            /** genuine empty states only */
            spacious: 'p-6',
            /** the card manages its own padding internally */
            none: '',
        },
    },
    defaultVariants: { variant: 'default', padding: 'none' },
});

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, padding, ...props }, ref) => (
        <div ref={ref} className={cn(cardVariants({ variant, padding }), className)} {...props} />
    ),
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        // 2px between title and subtitle, not 6px — they are one unit.
        <div ref={ref} className={cn('flex flex-col gap-0.5 p-5', className)} {...props} />
    ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('text-base font-semibold leading-tight tracking-tight', className)} {...props} />
    ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
    ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
    ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
    ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
