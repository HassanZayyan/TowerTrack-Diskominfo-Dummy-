import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * `role="alert"` is new. This rendered a bare <p> that no assistive technology
 * connected to the field it described, so an invalid form announced nothing.
 *
 * Uses destructive-strong (6.47:1) rather than the fill token: this is text on
 * a light surface, and the bare token is calibrated for white ON it, not for it
 * on white.
 */
export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            role="alert"
            className={cn('text-sm text-destructive-strong', className)}
        >
            {message}
        </p>
    ) : null;
}
