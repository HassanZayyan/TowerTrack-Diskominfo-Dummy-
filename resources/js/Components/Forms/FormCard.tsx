import React from 'react';

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Reusable Form Card Component
 * DRY: Provides consistent form card styling across the application
 * 
 * @example
 * ```tsx
 * <FormCard padding="md">
 *   <FormHeader ... />
 *   <form>...</form>
 * </FormCard>
 * ```
 */
export default function FormCard({
  children,
  className = '',
  padding = 'md',
}: FormCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-border ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

