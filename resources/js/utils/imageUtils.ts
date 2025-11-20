/**
 * DRY Utilities for image optimization and URL generation
 */

/**
 * Get optimized image URL with size parameters
 * 
 * @param path Storage path
 * @param width Desired width (optional)
 * @param quality JPEG quality (0-100, default: 85)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  path: string,
  width?: number,
  quality: number = 85
): string {
  const baseUrl = path.startsWith('http') ? path : `/storage/${path}`;
  
  if (width) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}w=${width}&q=${quality}`;
  }
  
  return baseUrl;
}

/**
 * Generate srcSet for responsive images
 * 
 * @param path Storage path
 * @param widths Array of widths for different breakpoints
 * @param quality JPEG quality
 * @returns srcSet string
 */
export function generateSrcSet(
  path: string,
  widths: number[] = [400, 800, 1200],
  quality: number = 85
): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(path, width, quality)} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * 
 * @param breakpoints Breakpoint configuration
 * @returns sizes string
 */
export function generateSizes(
  breakpoints: { maxWidth?: number; size: string }[] = [
    { maxWidth: 640, size: '400px' },
    { maxWidth: 1024, size: '800px' },
    { size: '1200px' },
  ]
): string {
  return breakpoints
    .map((bp) => (bp.maxWidth ? `(max-width: ${bp.maxWidth}px) ${bp.size}` : bp.size))
    .join(', ');
}

/**
 * Get responsive image props
 * 
 * @param path Storage path
 * @param options Configuration options
 * @returns Object with src, srcSet, and sizes
 */
export function getResponsiveImageProps(
  path: string,
  options: {
    widths?: number[];
    quality?: number;
    sizes?: string;
    breakpoints?: { maxWidth?: number; size: string }[];
  } = {}
) {
  const {
    widths = [400, 800, 1200],
    quality = 85,
    sizes,
    breakpoints,
  } = options;

  return {
    src: getOptimizedImageUrl(path, widths[widths.length - 1], quality),
    srcSet: generateSrcSet(path, widths, quality),
    sizes: sizes || generateSizes(breakpoints),
  };
}

