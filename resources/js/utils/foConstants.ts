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
export const getStatusLabel = (status: string, _withEmoji: boolean = false): string => {
  // The emoji variant is gone. A status is already carried by a Badge with a
  // semantic fill; prefixing the label with ✅ / ❌ / 🔧 added a second, less
  // accessible encoding of the same thing — screen readers announce the emoji
  // name, and the glyphs render differently on every platform.
  // The parameter is kept so the existing call sites still compile.
  return STATUS_LABELS[status] || status;
};

/**
 * Get type label with optional emoji
 */
export const getTypeLabel = (type: string, _withEmoji: boolean = false): string => {
  // Same reasoning as getStatusLabel — and this one prefixed EVERY type with
  // the same 🔧, so it distinguished nothing at all.
  return TYPE_LABELS[type] || type;
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
    // Neutral on purpose. These are CATEGORIES, and the label next to the chip
    // already names each one. The previous map spent green on "Junction" and
    // red on "Endpoint" — the two colours that mean success and danger
    // everywhere else in this app — so an ordinary point type read as a status.
    hub: { bg: 'bg-muted', text: 'text-neutral-strong', label: 'Hub' },
    junction: { bg: 'bg-muted', text: 'text-neutral-strong', label: 'Junction' },
    pole: { bg: 'bg-muted', text: 'text-neutral-strong', label: 'Pole' },
    endpoint: { bg: 'bg-muted', text: 'text-neutral-strong', label: 'Endpoint' },
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