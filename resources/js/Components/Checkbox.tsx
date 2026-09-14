import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={cn(
                'rounded border-input text-primary shadow-xs',
                'focus:ring focus:ring-offset-0',
                className,
            )}
        />
    );
}
