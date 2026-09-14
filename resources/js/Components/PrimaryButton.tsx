import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Was stock Laravel Breeze: bg-gray-800 with an indigo focus ring and
 * `uppercase tracking-widest text-xs` labels. The brand never reached it, so
 * every auth screen shouted MASUK in a colour the app does not use anywhere.
 *
 * Now token-driven, so the palette is a one-file change from here on.
 */
export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2',
                'text-sm font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
                'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
