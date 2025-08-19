/**
 * Utility functions for file handling
 */

/**
 * Validates image file type and size
 * @param file File to validate
 * @returns Object containing validation status and error message if any
 */
export function validateImageFile(file: File): { valid: boolean; message: string } {
  const allowedImageTypes = ['image/jpeg', 'image/png'];
  const maxImageSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedImageTypes.includes(file.type)) {
    return { valid: false, message: 'Hanya file JPG dan PNG yang diizinkan untuk foto' };
  }
  
  if (file.size > maxImageSize) {
    return { valid: false, message: 'Ukuran foto tidak boleh melebihi 5MB' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validates video file type and size
 * @param file File to validate
 * @returns Object containing validation status and error message if any
 */
export function validateVideoFile(file: File): { valid: boolean; message: string } {
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/x-matroska'];
  const maxVideoSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedVideoTypes.includes(file.type)) {
    return { valid: false, message: 'Hanya file MP4, MOV, AVI, dan MKV yang diizinkan untuk video' };
  }
  
  if (file.size > maxVideoSize) {
    return { valid: false, message: 'Ukuran video tidak boleh melebihi 50MB' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validates file count for images and videos
 * @param currentCount Current number of files
 * @param isImage Whether checking images or videos
 * @returns Object containing validation status and error message if any
 */
export function validateFileCount(currentCount: number, isImage: boolean): { valid: boolean; message: string } {
  if (isImage && currentCount >= 3) {
    return { valid: false, message: 'Maksimal 3 foto yang dapat diunggah' };
  }
  
  if (!isImage && currentCount >= 2) {
    return { valid: false, message: 'Maksimal 2 video yang dapat diunggah' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate a phone number
 * @param phoneNumber Phone number to validate
 * @returns Object containing validation status and error message if any
 */
export function validatePhoneNumber(phoneNumber: string): { valid: boolean; message: string } {
  const phoneRegex = /^[\+]?[0-9\-]{8,15}$/;
  
  if (!phoneRegex.test(phoneNumber)) {
    return { valid: false, message: 'Format nomor telepon tidak valid. Gunakan 8-15 digit angka' };
  }
  
  return { valid: true, message: '' };
}
