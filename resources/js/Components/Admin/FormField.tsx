/**
 * Reusable form field component with consistent styling and error handling
 * DRY: Eliminates duplication of form input, select, and textarea fields
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'url' | 'email' | 'password';
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  step?: string;
  min?: number;
  max?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  showIcon?: boolean;
  colorScheme?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  icon,
  className = '',
  inputClassName = '',
  disabled = false,
  step,
  min,
  max,
  rows,
  options,
  showIcon = true,
  colorScheme = 'red',
}) => {
  const colorClasses = {
    red: {
      focus: 'focus:border-red-500 focus:ring-red-100',
      icon: 'text-red-600',
      error: 'text-red-600',
    },
    blue: {
      focus: 'focus:border-blue-500 focus:ring-blue-100',
      icon: 'text-blue-600',
      error: 'text-blue-600',
    },
    green: {
      focus: 'focus:border-green-500 focus:ring-green-100',
      icon: 'text-green-600',
      error: 'text-green-600',
    },
    yellow: {
      focus: 'focus:border-yellow-500 focus:ring-yellow-100',
      icon: 'text-yellow-600',
      error: 'text-yellow-600',
    },
    purple: {
      focus: 'focus:border-purple-500 focus:ring-purple-100',
      icon: 'text-purple-600',
      error: 'text-purple-600',
    },
  };

  const colors = colorClasses[colorScheme];

  const baseInputClasses = `block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
    error
      ? `border-red-300 ${colors.focus} focus:ring-4`
      : `border-gray-200 ${colors.focus} focus:ring-4 hover:border-gray-300`
  } focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${inputClassName}`;

  const renderInput = () => {
    if (options) {
      return (
        <div className="relative">
          <select
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} appearance-none bg-white`}
            disabled={disabled}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {showIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      );
    }

    if (rows) {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClasses} resize-none`}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
      );
    }

    return (
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
        />
        {showIcon && icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        {icon && <span className={colors.icon}>{icon}</span>}
        <span className="flex-1">{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>
      {renderInput()}
      {error && (
        <div className={`flex items-center gap-2 mt-2 text-sm ${colors.error}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;

