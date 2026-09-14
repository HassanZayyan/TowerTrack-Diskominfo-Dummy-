import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * The shadcn/ui Button contract.
 *
 * Deliberate differences from the buttons this replaces:
 * - Flat fills, no gradients. The old primary was a red gradient with shadow-lg.
 * - `text-sm font-medium` sentence case, not `text-xs uppercase tracking-widest`.
 * - Hover shifts the background; it never scales or lifts the element.
 * - One focus recipe: focus-visible only, so a mouse click does not leave a ring
 *   behind but a keyboard user always has a visible position.
 * - `destructive` is a real variant, so pages stop hand-rolling red buttons.
 */
const buttonVariants = cva(
    cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    ),
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-strong',
                outline: 'border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                success: 'bg-success text-success-foreground hover:bg-success-strong',
                /* For placing on a brand-coloured ground (app bar, hero band). */
                onBrand: 'bg-white text-primary hover:bg-white/90',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-11 rounded-md px-6 text-base',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
