import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2',
                'text-sm font-medium transition-colors shadow-xs',
                'border-input bg-background text-foreground',
                'hover:bg-accent hover:text-accent-foreground',
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
