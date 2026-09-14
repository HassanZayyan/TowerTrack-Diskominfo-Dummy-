import React from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface TextareaWithCounterProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  focusColor?: 'blue' | 'indigo' | 'red';
  className?: string;
}

const focusColors = {
  blue: 'focus:border-border-strong focus-visible:ring',
  indigo: 'focus:border-border-strong focus-visible:ring',
  red: 'focus:border-destructive-strong focus:ring-destructive',
};

/**
 * Reusable Textarea with Character Counter Component
 * DRY: Eliminates duplication of textarea with character counter pattern
 * 
 * @example
 * ```tsx
 * <TextareaWithCounter
 *   id="message"
 *   label="Komentar *"
 *   value={data.message}
 *   onChange={(value) => setData('message', value)}
 *   error={errors.message}
 *   maxLength={1000}
 *   rows={4}
 *   placeholder="Tulis komentar Anda di sini..."
 *   required
 *   focusColor="blue"
 * />
 * ```
 */
export default function TextareaWithCounter({
  id,
  label,
  value,
  onChange,
  error,
  maxLength = 1000,
  rows = 4,
  placeholder,
  required = false,
  focusColor = 'blue',
  className = '',
}: TextareaWithCounterProps) {
  return (
    <div className={className}>
      <InputLabel htmlFor={id} value={label} />
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 block w-full border-input ${focusColors[focusColor]} rounded-md shadow-sm`}
        rows={rows}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
      />
      <InputError message={error} className="mt-1" />
      <p className="mt-1 text-sm text-muted-foreground">
        {value.length}/{maxLength} karakter
      </p>
    </div>
  );
}

