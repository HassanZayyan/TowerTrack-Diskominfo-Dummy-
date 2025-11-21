/**
 * Media Helper Utilities
 * 
 * Provides consistent media URL handling and type detection across the application.
 */

/**
 * Get full media URL from storage path
 * Handles both absolute URLs and relative storage paths
 * 
 * @param path Media path (can be absolute URL or storage path)
 * @returns Full URL to the media file
 */
export function getMediaUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `/storage/${path}`;
}

/**
 * Check if a file path or type is an image
 * 
 * @param path File path or URL
 * @param type Optional MIME type (e.g., 'image/jpeg', 'image')
 * @returns True if the file is an image
 */
export function isImage(path: string, type?: string): boolean {
  if (type) return type === 'image' || type.startsWith('image/');
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
}

/**
 * Check if a file path or type is a video
 * 
 * @param path File path or URL
 * @param type Optional MIME type (e.g., 'video/mp4', 'video')
 * @returns True if the file is a video
 */
export function isVideo(path: string, type?: string): boolean {
  if (type) return type === 'video' || type.startsWith('video/');
  return /\.(mp4|mov|avi|webm|mkv)$/i.test(path);
}

/**
 * Validate file type for upload (image or video)
 * Used in file selection handlers
 * 
 * @param file File object to validate
 * @returns Object with validation status and error message
 */
export function validateMediaFile(file: File): { valid: boolean; message: string } {
  const isImg = file.type.startsWith('image/');
  const isVid = file.type.startsWith('video/');
  
  if (!isImg && !isVid) {
    return { valid: false, message: 'Hanya file gambar atau video yang diizinkan' };
  }
  
  const validSize = isImg ? file.size <= 5 * 1024 * 1024 : file.size <= 50 * 1024 * 1024;
  
  if (!validSize) {
    const maxSize = isImg ? '5MB' : '50MB';
    return { valid: false, message: `Ukuran file tidak boleh melebihi ${maxSize}` };
  }
  
  return { valid: true, message: '' };
}

