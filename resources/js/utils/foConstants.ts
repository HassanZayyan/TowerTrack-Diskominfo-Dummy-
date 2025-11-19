/**
 * Shared constants for FO (Fiber Optic) management
 * DRY: Centralized constants to avoid duplication across components
 */

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