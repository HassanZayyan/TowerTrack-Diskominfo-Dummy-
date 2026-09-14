/**
 * Status Helper Utilities
 * 
 * Provides consistent status color mapping and labels across the application.
 */

import React from 'react';

export type StatusConfig = {
  bg: string;
  text: string;
  label: string;
};

export type FOStatusConfig = {
  bg: string;
  text: string;
  light: string;
  label: string;
  border: string;
  dot: string;
};

/**
 * Get status color configuration for message statuses (reports/feedbacks).
 * 
 * @param status Status value (pending, in_progress, closed)
 * @returns Status configuration with background color, text color, and label
 */
export function getStatusColor(status: string | undefined | null): StatusConfig {
  const statusConfig: Record<string, StatusConfig> = {
    // Literals only because callers feed them to inline style. They MUST stay
    // in lockstep with getStatusBadgeClass below and with the tokens in
    // app.css — these two maps disagreed for a long time (pending was amber
    // here and red there), which is why the same status rendered two different
    // colours depending on which helper a component happened to call.
    pending: { bg: '#FFFBEB', text: '#92400E', label: 'Menunggu' },
    in_progress: { bg: '#F5F5F4', text: '#44403C', label: 'Sedang Diproses' },
    closed: { bg: '#ECFDF5', text: '#065F46', label: 'Selesai' },
    // Backward compatibility for old status values
    responded: { bg: '#F5F5F4', text: '#44403C', label: 'Sedang Diproses' },
    resolved: { bg: '#ECFDF5', text: '#065F46', label: 'Selesai' },
  };

  if (!status) {
    return { bg: '#F5F5F4', text: '#44403C', label: 'Tidak diketahui' };
  }

  return statusConfig[status] || {
    bg: '#F5F5F4',
    text: '#44403C',
    label: status.replace(/_/g, ' ') || 'Tidak diketahui',
  };
}

/**
 * Get status color configuration for FO (Fiber Optic) statuses.
 * 
 * @param status FO status value (active, inactive, maintenance)
 * @returns FO status configuration with background color, text color, light background, border, dot, and label
 */
export function getFOStatusColor(status: string | undefined | null): FOStatusConfig {
  const foStatusConfig: Record<string, FOStatusConfig> = {
    active: { 
      bg: 'bg-success-soft',
      text: 'text-success-strong',
      light: 'bg-success-soft',
      border: 'border-success-border',
      dot: 'bg-success',
      label: 'Aktif' 
    },
    inactive: { 
      bg: 'bg-destructive-soft',
      text: 'text-destructive-strong',
      light: 'bg-destructive-soft',
      border: 'border-destructive-border',
      dot: 'bg-destructive',
      label: 'Non-aktif' 
    },
    maintenance: { 
      bg: 'bg-warning-soft',
      text: 'text-warning-strong',
      light: 'bg-warning-soft',
      border: 'border-warning-border',
      dot: 'bg-warning',
      label: 'Maintenance' 
    },
  };

  if (!status) {
    return { 
      bg: 'bg-neutral-soft',
      text: 'text-neutral-strong',
      light: 'bg-neutral-soft',
      border: 'border-neutral-border',
      dot: 'bg-neutral',
      label: 'Tidak diketahui' 
    };
  }

  return foStatusConfig[status] || {
    bg: 'bg-neutral-soft',
    text: 'text-neutral-strong',
    light: 'bg-neutral-soft',
    border: 'border-neutral-border',
    dot: 'bg-neutral',
    label: status.replace(/_/g, ' ') || 'Tidak diketahui',
  };
}

/**
 * Get status badge class names for FO statuses (Tailwind CSS classes).
 * 
 * @param status FO status value
 * @returns Tailwind CSS class string for badge styling
 */
export function getFOStatusBadgeClass(status: string | undefined | null): string {
  const configs: Record<string, string> = {
    active: 'bg-success-soft text-success-strong',
    inactive: 'bg-destructive-soft text-destructive-strong',
    maintenance: 'bg-warning-soft text-warning-strong border border-warning-border',
  };

  return configs[status || ''] || 'bg-neutral-soft text-neutral-strong';
}

/**
 * Get status badge class names for message statuses (Tailwind CSS classes).
 * 
 * @param status Message status value
 * @returns Tailwind CSS class string for badge styling
 */
export function getStatusBadgeClass(status: string | undefined | null): string {
  const configs: Record<string, string> = {
    pending: 'bg-warning-soft text-warning-strong border-warning-border',
    in_progress: 'bg-info-soft text-info-strong border-info-border',
    closed: 'bg-success-soft text-success-strong border-success-border',
    // Backward compatibility for old status values
    responded: 'bg-info-soft text-info-strong border-info-border',
    resolved: 'bg-success-soft text-success-strong border-success-border',
  };

  return configs[status || ''] || 'bg-neutral-soft text-neutral-strong border-neutral-border';
}

/**
 * Get status label for message statuses (Reports/Feedbacks).
 * 
 * @param status Message status value
 * @returns Status label in Indonesian
 */
export function getStatusLabel(status: string | undefined | null): string {
  const labels: Record<string, string> = {
    pending: 'BARU',
    in_progress: 'PROGRESS',
    closed: 'SELESAI',
    // Backward compatibility for old status values
    responded: 'PROGRESS',
    resolved: 'SELESAI',
  };

  return labels[status || ''] || 'TIDAK DIKETAHUI';
}

/**
 * Render status badge JSX for message statuses (Reports/Feedbacks).
 * 
 * @param status Message status value
 * @param className Additional CSS classes
 * @returns JSX element for status badge
 */
export function renderMessageStatusBadge(status: string | undefined | null, className: string = ''): React.ReactElement {
  const label = getStatusLabel(status);
  const classes = getStatusBadgeClass(status);
  return React.createElement(
    'span',
    { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${classes} ${className}` },
    label
  );
}
