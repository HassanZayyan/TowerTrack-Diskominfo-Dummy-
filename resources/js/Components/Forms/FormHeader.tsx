import React from 'react';

interface FormHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconBgColor?: 'blue' | 'indigo' | 'red' | 'green' | 'purple' | 'orange';
  className?: string;
}

// Icon tile grounds. Every key resolves to a token now; the map is kept so the
// existing `color` prop on call sites still compiles.
const iconBgColors = {
  blue: 'bg-muted',
  indigo: 'bg-muted',
  red: 'bg-destructive-soft',
  green: 'bg-success-soft',
  purple: 'bg-muted',
  orange: 'bg-warning-soft',
};

/**
 * Reusable Form Header Component
 * DRY: Eliminates duplication of form header with icon pattern
 * 
 * @example
 * ```tsx
 * <FormHeader
 *   icon={<svg>...</svg>}
 *   title="Tulis Komentar"
 *   description="Komentar Anda akan terlihat oleh publik"
 *   iconBgColor="blue"
 * />
 * ```
 */
export default function FormHeader({
  icon,
  title,
  description,
  iconBgColor = 'blue',
  className = '',
}: FormHeaderProps) {
  return (
    <div className={`flex items-center gap-3 mb-5 ${className}`}>
      <div className={`p-2 ${iconBgColors[iconBgColor]} rounded-lg shadow-sm`}>
        <div className="w-5 h-5 text-white">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

