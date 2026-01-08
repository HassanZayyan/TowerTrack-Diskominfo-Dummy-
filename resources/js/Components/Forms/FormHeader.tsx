import React from 'react';

interface FormHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconBgColor?: 'blue' | 'indigo' | 'red' | 'green' | 'purple' | 'orange';
  className?: string;
}

const iconBgColors = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  green: 'bg-gradient-to-br from-green-500 to-green-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
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
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

