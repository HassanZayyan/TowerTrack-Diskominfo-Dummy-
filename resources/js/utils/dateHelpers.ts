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

/**
 * Format date string with full date and time (for detail pages).
 * 
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "15 Januari 2024, 14:30")
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date string for HTML date input (YYYY-MM-DD).
 * 
 * @param dateValue Date string or null/undefined
 * @returns Formatted date string in YYYY-MM-DD format or empty string
 */
export function formatDateForInput(dateValue: string | null | undefined): string {
  if (!dateValue) return '';
  
  try {
    // Handle various date formats from backend
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    
    // Format to YYYY-MM-DD for HTML date input
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return '';
  }
}

/**
 * Format date string to Indonesian locale with date only (no time).
 * 
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "15 Januari 2024")
 */
export function formatDateOnly(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date and time separately (for display in tables/cards).
 * 
 * @param dateString ISO date string
 * @returns Object with formatted date and time
 */
export function formatDateTimeSeparate(dateString: string): { date: string; time: string } {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

/**
 * Format date with separator (for timeline components).
 * 
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "15 Jan 2024 • 14:30")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('id-ID')} • ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

