/**
 * Modal Style Constants
 * DRY: Centralized modal styling constants untuk konsistensi
 */

export const MODAL_STYLES = {
  backdrop: {
    base: 'fixed inset-0 bg-black flex items-center justify-center p-4',
    overflow: 'hidden',
    position: 'fixed' as const,
  },
  container: {
    base: 'bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden',
    maxHeights: {
      small: 'max-h-[85vh]',
      medium: 'max-h-[90vh]',
      large: 'max-h-[95vh]',
    },
    rounded: {
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
    },
  },
  zIndex: {
    modal: 50,
    dialog: 100,
    overlay: 1000,
  },
  opacity: {
    light: 30,
    medium: 50,
    dark: 60,
    darker: 90,
  },
} as const;

/**
 * Helper function untuk mendapatkan backdrop opacity class
 */
export function getBackdropOpacity(opacity: number): string {
  return `rgba(0, 0, 0, ${opacity / 100})`;
}

/**
 * Helper function untuk mendapatkan max width class
 */
export function getMaxWidthClass(maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'): string {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };
  return maxWidthClasses[maxWidth];
}



