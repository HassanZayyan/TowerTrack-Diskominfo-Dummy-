import React from 'react';
import { getFOStatusColor } from '@/utils/statusHelpers';

interface FOStatusBadgeProps {
  status: string | undefined | null;
  className?: string;
  showDot?: boolean;
}

/**
 * Reusable component for displaying FO (Fiber Optic) status badges.
 * Uses getFOStatusColor from statusHelpers for consistent styling.
 * 
 * @param status FO status value (active, inactive, maintenance)
 * @param className Additional CSS classes
 * @param showDot Whether to show the status dot indicator
 * @returns JSX element for FO status badge
 */
export default function FOStatusBadge({ 
  status, 
  className = '', 
  showDot = true 
}: FOStatusBadgeProps): React.ReactElement {
  const statusConfig = getFOStatusColor(status);
  
  return React.createElement(
    'span',
    { 
      className: `inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} ${className}` 
    },
    showDot && React.createElement(
      'div',
      { className: `w-2 h-2 rounded-full mr-2 ${statusConfig.dot}` }
    ),
    statusConfig.label
  );
}

