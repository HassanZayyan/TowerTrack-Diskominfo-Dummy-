import { LabelHTMLAttributes } from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
    return (
        <label
            {...props}
            className={`block text-sm font-medium ${className}`}
            style={{ color: '#212121' }}
        >
            {value ? value : children}
        </label>
    );
}
