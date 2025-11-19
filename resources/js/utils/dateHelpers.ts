/**
 * Date Helper Utilities
 * 
 * Provides consistent date formatting across the application.
 */

/**
 * Format date string to relative time or formatted date.
 * 
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Hari ini", "Kemarin", "2 hari yang lalu", or "15 Jan 2024")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Hari ini';
  if (diffDays === 2) return 'Kemarin';
  if (diffDays <= 7) return `${diffDays - 1} hari yang lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date string with time included.
 * 
 * @param dateString ISO date string
 * @returns Formatted date string with time (e.g., "Hari ini • 14:30")
 */
export function formatDateWithTime(dateString: string): string {
  const date = new Date(dateString);
  const formattedDate = formatDate(dateString);
  const formattedTime = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${formattedDate} • ${formattedTime}`;
}

