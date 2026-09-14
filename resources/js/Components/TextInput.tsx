import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import { cn } from '@/lib/utils';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={cn(
                'rounded-md shadow-xs transition-colors',
                // border-input is 3.33:1 on white. The old border-gray-300
                // was 1.48:1, which failed SC 1.4.11 as a control boundary.
                'border-input bg-background text-foreground placeholder:text-placeholder',
                'focus:border-ring focus:ring focus:ring-offset-0',
                'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
                className,
            )}
            ref={localRef}
        />
    );
});
