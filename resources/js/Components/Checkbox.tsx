import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={'rounded border-gray-300 text-[#B71C1C] shadow-sm focus:ring-[#B71C1C] ' + className}
        />
    );
}
