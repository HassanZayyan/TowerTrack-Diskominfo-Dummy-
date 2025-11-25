/**
 * Shared constants for FO (Fiber Optic) management
 * DRY: Centralized constants to avoid duplication across components
 */

import React from 'react';

/**
 * Status labels in Indonesian
 */
export const STATUS_LABELS: { [key: string]: string } = {
  active: 'Aktif',
  inactive: 'Non-aktif',
  maintenance: 'Maintenance'
};

/**
 * Type labels for FO points
 */
export const TYPE_LABELS: { [key: string]: string } = {
  pole: 'Tiang/Pole',
  junction: 'Junction Box',
  hub: 'Hub',
  endpoint: 'Endpoint'
};

/**
 * Available FO point types
 */
export const FO_POINT_TYPES = ['pole', 'junction', 'hub', 'endpoint'] as const;

/**
 * Available FO statuses
 */
export const FO_STATUSES = ['active', 'inactive', 'maintenance'] as const;

/**
 * Available areas
 */
export const FO_AREAS = ['ungaran'] as const;

/**
 * Get status label with optional emoji
 */
export const getStatusLabel = (status: string, withEmoji: boolean = false): string => {
  const label = STATUS_LABELS[status] || status;
  
  if (!withEmoji) {
    return label;
  }
  
  const emoji = status === 'active' ? '✅' : status === 'inactive' ? '❌' : '🔧';
  return `${emoji} ${label}`;
};

/**
 * Get type label with optional emoji
 */
export const getTypeLabel = (type: string, withEmoji: boolean = false): string => {
  const label = TYPE_LABELS[type] || type;
  
  if (!withEmoji) {
    return label;
  }
  
  return `🔧 ${label}`;
};

/**
 * Type badge configuration for FO points
 */
export type TypeBadgeConfig = {
  bg: string;
  text: string;
  label: string;
};

/**
 * Get type badge configuration for FO points
 * 
 * @param type FO point type (pole, junction, hub, endpoint)
 * @returns Type badge configuration with Tailwind classes
 */
export function getTypeBadgeConfig(type: string): TypeBadgeConfig {
  const typeConfig: Record<string, TypeBadgeConfig> = {
    hub: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Hub' },
    junction: { bg: 'bg-green-100', text: 'text-green-800', label: 'Junction' },
    pole: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pole' },
    endpoint: { bg: 'bg-red-100', text: 'text-red-800', label: 'Endpoint' },
  };
  
  return typeConfig[type] || typeConfig.hub;
}

/**
 * Render type badge JSX element
 * 
 * @param type FO point type
 * @param className Additional CSS classes
 * @returns JSX element for type badge
 */
export function renderTypeBadge(type: string, className: string = ''): React.ReactElement {
  const config = getTypeBadgeConfig(type);
  return React.createElement(
    'span',
    { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} ${className}` },
    config.label
  );
}