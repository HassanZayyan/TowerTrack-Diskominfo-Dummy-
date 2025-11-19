/**
 * Status Helper Utilities
 * 
 * Provides consistent status color mapping and labels across the application.
 */

export type StatusConfig = {
  bg: string;
  text: string;
  label: string;
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

