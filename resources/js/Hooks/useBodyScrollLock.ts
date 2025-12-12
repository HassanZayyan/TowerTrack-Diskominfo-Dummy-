import { useEffect } from 'react';

/**
 * Custom hook untuk mencegah body scroll saat modal/dialog terbuka
 * DRY: Reusable body scroll lock pattern
 * 
 * Mencegah body scroll dengan:
 * 1. Menyimpan scroll position saat modal dibuka
 * 2. Lock body scroll dengan position: fixed
 * 3. Restore scroll position saat modal ditutup
 * 
 * @param isLocked - Boolean untuk menentukan apakah scroll harus di-lock
 * @returns void
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * useBodyScrollLock(isOpen);
 * ```
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      // Simpan scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position saat modal ditutup
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}



