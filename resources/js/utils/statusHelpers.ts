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
 * @param status Status value (pending, in_progress, responded, resolved, closed)
 * @returns Status configuration with background color, text color, and label
 */
export function getStatusColor(status: string | undefined | null): StatusConfig {
  const statusConfig: Record<string, StatusConfig> = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu' },
    in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sedang Diproses' },
    responded: { bg: '#E0E7FF', text: '#3730A3', label: 'Sudah Dibalas' },
    resolved: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
    closed: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
  };

  if (!status) {
    return { bg: '#F3F4F6', text: '#374151', label: 'Tidak diketahui' };
  }

  return statusConfig[status] || {
    bg: '#F3F4F6',
    text: '#374151',
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
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      light: 'bg-green-50',
      border: 'border-green-200',
      dot: 'bg-green-500',
      label: 'Aktif' 
    },
    inactive: { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      light: 'bg-red-50',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Non-aktif' 
    },
    maintenance: { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      light: 'bg-yellow-50',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Maintenance' 
    },
  };

  if (!status) {
    return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      light: 'bg-gray-50',
      border: 'border-gray-200',
      dot: 'bg-gray-500',
      label: 'Tidak diketahui' 
    };
  }

  return foStatusConfig[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    light: 'bg-gray-50',
    border: 'border-gray-200',
    dot: 'bg-gray-500',
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
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  };

  return configs[status || ''] || 'bg-gray-100 text-gray-800';
}

/**
 * Get status badge class names for message statuses (Tailwind CSS classes).
 * 
 * @param status Message status value
 * @returns Tailwind CSS class string for badge styling
 */
export function getStatusBadgeClass(status: string | undefined | null): string {
  const configs: Record<string, string> = {
    pending: 'bg-red-100 text-red-800 border-red-300',
    in_progress: 'bg-orange-100 text-orange-800 border-orange-300',
    closed: 'bg-green-100 text-green-800 border-green-300',
    responded: 'bg-green-100 text-green-800 border-green-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
  };

  return configs[status || ''] || 'bg-gray-100 text-gray-800 border-gray-300';
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
    responded: 'DIBALAS',
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