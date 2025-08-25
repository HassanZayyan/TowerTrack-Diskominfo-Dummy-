/**
 * Utility functions for location-based operations
 */

// Interface for coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Interface for geolocation result
export interface LocationResult {
  success: boolean;
  coordinates?: Coordinates;
  error?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate point
 * @param coord2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}

/**
 * Get user's current location using Geolocation API
 * @param options Geolocation options
 * @returns Promise with location result
 */
export function getCurrentLocation(options?: PositionOptions): Promise<LocationResult> {
  return new Promise((resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation tidak didukung oleh browser ini'
      });
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        });
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis. Silakan coba lagi.';
            break;
          default:
            errorMessage = 'Terjadi kesalahan saat mendapatkan lokasi.';
            break;
        }
        
        resolve({
          success: false,
          error: errorMessage
        });
      },
      defaultOptions
    );
  });
}

/**
 * Validate if user location is within allowed distance from tower
 * @param userLocation User's coordinates
 * @param towerLocation Tower's coordinates
 * @param maxDistanceKm Maximum allowed distance in kilometers (default: 1)
 * @returns Validation result with distance info
 */
export function validateLocationDistance(
  userLocation: Coordinates,
  towerLocation: Coordinates,
  maxDistanceKm: number = 1
): { valid: boolean; distance: number; message: string } {
  const distance = calculateDistance(userLocation, towerLocation);
  const valid = distance <= maxDistanceKm;
  
  return {
    valid,
    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
    message: valid 
      ? `Lokasi Anda valid (jarak: ${Math.round(distance * 100) / 100} km)`
      : `Anda terlalu jauh dari tower (jarak: ${Math.round(distance * 100) / 100} km). Maksimal jarak yang diizinkan adalah ${maxDistanceKm} km.`
  };
}

/**
 * Request location permission and validate distance from tower
 * @param towerLocation Tower coordinates to validate against
 * @param maxDistanceKm Maximum allowed distance (default: 1km)
 * @returns Promise with validation result
 */
export async function requestLocationAndValidate(
  towerLocation: Coordinates,
  maxDistanceKm: number = 1
): Promise<{ success: boolean; message: string; distance?: number }> {
  try {
    const locationResult = await getCurrentLocation();
    
    if (!locationResult.success) {
      return {
        success: false,
        message: locationResult.error || 'Gagal mendapatkan lokasi'
      };
    }
    
    if (!locationResult.coordinates) {
      return {
        success: false,
        message: 'Koordinat lokasi tidak tersedia'
      };
    }
    
    const validation = validateLocationDistance(
      locationResult.coordinates,
      towerLocation,
      maxDistanceKm
    );
    
    return {
      success: validation.valid,
      message: validation.message,
      distance: validation.distance
    };
  } catch (error) {
    return {
      success: false,
      message: 'Terjadi kesalahan saat memvalidasi lokasi'
    };
  }
}