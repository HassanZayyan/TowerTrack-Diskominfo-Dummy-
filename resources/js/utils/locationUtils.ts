/**
 * Utility functions for location-based operations
 */

import type { Coordinates } from '@/types';

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

// Interface for geolocation result with accuracy
export interface LocationResultWithAccuracy {
  success: boolean;
  coordinates?: Coordinates;
  accuracy?: number;
  error?: string;
}

/**
 * Get user's current location using Geolocation API with improved accuracy
 * @param options Geolocation options
 * @returns Promise with location result
 */
export function getCurrentLocation(options?: PositionOptions): Promise<LocationResultWithAccuracy> {
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
      timeout: 15000, // Increased timeout for better accuracy
      maximumAge: 60000, // Reduced to 1 minute for fresher data
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy: position.coords.accuracy
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
 * Clear browser geolocation cache to force fresh location data
 * This helps when switching accounts or when coordinates seem stale
 */
export function clearLocationCache(): void {
  // Clear any stored location data in localStorage/sessionStorage
  try {
    localStorage.removeItem('lastKnownLocation');
    localStorage.removeItem('cachedLocation');
    sessionStorage.removeItem('lastKnownLocation');
    sessionStorage.removeItem('cachedLocation');
  } catch (error) {
    console.warn('Could not clear location cache:', error);
  }
}

/**
 * Get fresh location data with cache clearing for account switching
 * @param forceFresh Force fresh location even if cached data exists
 * @returns Promise with location result
 */
export function getFreshLocation(forceFresh: boolean = false): Promise<LocationResultWithAccuracy> {
  return new Promise((resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation tidak didukung oleh browser ini'
      });
      return;
    }

    // Clear cache if forcing fresh location
    if (forceFresh) {
      clearLocationCache();
    }

    // Use very aggressive settings to get fresh location
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // 30 seconds for maximum accuracy
      maximumAge: forceFresh ? 0 : 10000 // Force fresh if requested, otherwise 10 seconds max
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          success: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy: position.coords.accuracy
        };

        // Store fresh location data
        try {
          localStorage.setItem('lastKnownLocation', JSON.stringify({
            ...result,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Could not store location data:', error);
        }

        resolve(result);
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia. Pastikan GPS aktif dan sinyal baik.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis. Coba pindah ke area terbuka atau restart WiFi.';
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
      options
    );
  });
}

/**
 * Get user's current location with progressive enhancement and retry mechanism
 * Tries multiple strategies to get the best possible location accuracy
 * @param maxRetries Maximum number of retry attempts
 * @param forceFresh Force fresh location data (useful for account switching)
 * @returns Promise with location result
 */
export function getCurrentLocationEnhanced(maxRetries: number = 3, forceFresh: boolean = false): Promise<LocationResultWithAccuracy> {
  return new Promise(async (resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation tidak didukung oleh browser ini'
      });
      return;
    }

    let bestResult: LocationResultWithAccuracy | null = null;
    let attempts = 0;

    // Strategy 1: Fresh high accuracy GPS (optimized timeout)
    const tryFreshHighAccuracyGPS = (): Promise<LocationResultWithAccuracy> => {
      return new Promise((resolveStrategy) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolveStrategy({
              success: true,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              accuracy: position.coords.accuracy
            });
          },
          () => {
            resolveStrategy({
              success: false,
              error: 'Fresh high accuracy GPS failed'
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 12000, // Reduced from 25s to 12s for faster response
            maximumAge: forceFresh ? 0 : 30000 // Increased from 5s to 30s to prefer cached location
          }
        );
      });
    };

    // Strategy 2: Balanced accuracy with moderate caching (optimized)
    const tryBalancedAccuracy = (): Promise<LocationResultWithAccuracy> => {
      return new Promise((resolveStrategy) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolveStrategy({
              success: true,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              accuracy: position.coords.accuracy
            });
          },
          () => {
            resolveStrategy({
              success: false,
              error: 'Balanced accuracy failed'
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 8000, // Reduced from 15s to 8s
            maximumAge: forceFresh ? 0 : 120000 // Increased from 60s to 120s (2 minutes) to prefer cached
          }
        );
      });
    };

    // Strategy 3: Fast fallback with cached data (optimized)
    const tryFastFallback = (): Promise<LocationResultWithAccuracy> => {
      return new Promise((resolveStrategy) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolveStrategy({
              success: true,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              },
              accuracy: position.coords.accuracy
            });
          },
          () => {
            resolveStrategy({
              success: false,
              error: 'Fast fallback failed'
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 5000, // Reduced from 8s to 5s
            maximumAge: forceFresh ? 0 : 300000 // 5 minutes max age (unchanged)
          }
        );
      });
    };

    // Try strategies in order of preference
    const strategies = [tryFreshHighAccuracyGPS, tryBalancedAccuracy, tryFastFallback];

    for (let i = 0; i < strategies.length && attempts < maxRetries; i++) {
      attempts++;
      
      try {
        const result = await strategies[i]();
        
        if (result.success && result.coordinates) {
          // Check if this result is better than our current best
          if (!bestResult || 
              (result.accuracy && bestResult.accuracy && result.accuracy < bestResult.accuracy) ||
              (!bestResult.accuracy && result.accuracy)) {
            bestResult = result;
            
            // If we get acceptable accuracy (better than 200 meters), accept it early for speed
            if (result.accuracy && result.accuracy <= 200) {
              resolve(result);
              return;
            }
          }
        }
        
        // Reduced delay between attempts for faster response
        if (i < strategies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
        }
      } catch (error) {
        console.warn(`Location strategy ${i + 1} failed:`, error);
      }
    }

    // Return the best result we found, or failure
    if (bestResult && bestResult.success) {
      resolve(bestResult);
    } else {
      resolve({
        success: false,
        error: 'Gagal mendapatkan lokasi setelah beberapa percobaan. Coba restart WiFi atau pindah ke area terbuka.'
      });
    }
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
 * Uses enhanced location capture for better accuracy, or reuses existing coordinates
 * @param towerLocation Tower coordinates to validate against
 * @param maxDistanceKm Maximum allowed distance (default: 1km)
 * @param existingCoordinates Optional: reuse existing coordinates to avoid double GPS capture
 * @returns Promise with validation result
 */
export async function requestLocationAndValidate(
  towerLocation: Coordinates,
  maxDistanceKm: number = 1,
  existingCoordinates?: Coordinates
): Promise<{ success: boolean; message: string; distance?: number }> {
  try {
    let userCoordinates: Coordinates;
    
    // If existing coordinates provided, use them directly (avoid double GPS capture)
    if (existingCoordinates) {
      userCoordinates = existingCoordinates;
    } else {
      // Use enhanced location capture for better accuracy
      const locationResult = await getCurrentLocationEnhanced(3);
      
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
      
      userCoordinates = locationResult.coordinates;
    }
    
    const validation = validateLocationDistance(
      userCoordinates,
      towerLocation,
      maxDistanceKm
    );
    
    // Add accuracy information to the message (if we have accuracy data)
    let enhancedMessage = validation.message;
    
    return {
      success: validation.valid,
      message: enhancedMessage,
      distance: validation.distance
    };
  } catch (error) {
    return {
      success: false,
      message: 'Terjadi kesalahan saat memvalidasi lokasi'
    };
  }
}

/**
 * Request user location for cases where tower coordinates are not available
 * Uses enhanced location capture for better accuracy
 * @returns Promise with location result including accuracy info
 */
export async function requestUserLocationForReporting(): Promise<{
  success: boolean;
  coordinates?: Coordinates;
  accuracy?: number;
  message: string;
}> {
  try {
    // Use enhanced location capture for better accuracy
    const locationResult = await getCurrentLocationEnhanced(3);
    
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
    
    // Provide feedback about location quality
    let qualityMessage = 'Lokasi berhasil diperoleh';
    if (locationResult.accuracy) {
      if (locationResult.accuracy <= 10) {
        qualityMessage = 'Lokasi diperoleh dengan akurasi tinggi (±10m)';
      } else if (locationResult.accuracy <= 50) {
        qualityMessage = 'Lokasi diperoleh dengan akurasi baik (±50m)';
      } else if (locationResult.accuracy <= 200) {
        qualityMessage = 'Lokasi diperoleh dengan akurasi sedang (±200m)';
      } else if (locationResult.accuracy <= 500) {
        qualityMessage = 'Lokasi diperoleh dengan akurasi cukup (±500m)';
      } else {
        qualityMessage = 'Lokasi diperoleh dengan akurasi rendah (±500m+)';
      }
    }
    
    return {
      success: true,
      coordinates: locationResult.coordinates,
      accuracy: locationResult.accuracy,
      message: qualityMessage
    };
  } catch (error) {
    return {
      success: false,
      message: 'Terjadi kesalahan saat mendapatkan lokasi'
    };
  }
}

/**
 * Advanced GPS calibration and validation system
 * Handles poor GPS accuracy and provides multiple fallback strategies
 */

// Interface for GPS diagnostics
export interface GPSDiagnostics {
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  source: 'gps' | 'network' | 'passive';
}

// Interface for location validation result
export interface LocationValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
  recommendations: string[];
  fallbackUsed?: boolean;
}

/**
 * Get GPS diagnostics for debugging location issues
 */
export function getGPSDiagnostics(position: GeolocationPosition): GPSDiagnostics {
  return {
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude || undefined,
    altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
    heading: position.coords.heading || undefined,
    speed: position.coords.speed || undefined,
    timestamp: position.timestamp,
    source: position.coords.accuracy < 50 ? 'gps' : 'network'
  };
}

/**
 * Validate location quality and provide recommendations
 */
export function validateLocationQuality(
  coordinates: Coordinates,
  accuracy: number,
  towerCoordinates?: Coordinates
): LocationValidationResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // If tower has no coordinates, we don't need strict GPS accuracy validation
  // because we can't validate distance anyway. Only validate for basic sanity.
  const hasTowerCoords = !!towerCoordinates;

  // Check accuracy - only enforce strict validation if tower has coordinates
  if (accuracy > 500) {
    if (hasTowerCoords) {
      // Strict validation only when we need to check distance to tower
      issues.push('Akurasi GPS sangat rendah (±500m+)');
      confidence = 'low';
      recommendations.push('Pindah ke area terbuka tanpa penghalang');
      recommendations.push('Pastikan GPS aktif dan tidak dalam mode hemat daya');
      recommendations.push('Coba restart aplikasi atau browser');
    } else {
      // Tower has no coordinates - accuracy is less critical, just warn
      issues.push('Akurasi GPS rendah (±500m+) - tidak mempengaruhi validasi karena tower tidak memiliki koordinat');
      confidence = 'medium'; // Don't block submission
      recommendations.push('Akurasi GPS rendah, namun tidak mempengaruhi pengiriman laporan');
    }
  } else if (accuracy > 200) {
    issues.push('Akurasi GPS sedang (±200-500m)');
    confidence = 'medium';
    recommendations.push('Coba tunggu beberapa detik untuk GPS lock yang lebih baik');
  } else if (accuracy > 50) {
    issues.push('Akurasi GPS cukup baik (±50-200m)');
    confidence = 'medium';
    recommendations.push('Akurasi GPS dapat digunakan untuk pelaporan');
  }

  // Check for suspicious coordinates (Indonesia bounds)
  if (coordinates.latitude < -11 || coordinates.latitude > 6 || 
      coordinates.longitude < 95 || coordinates.longitude > 141) {
    issues.push('Koordinat di luar wilayah Indonesia');
    confidence = 'low';
    recommendations.push('Pastikan GPS aktif dan tidak menggunakan VPN');
  }

  // Check distance to tower if provided
  if (towerCoordinates) {
    const distance = calculateDistance(coordinates, towerCoordinates);
    if (distance > 10) { // More than 10km seems suspicious
      issues.push(`Jarak ke tower sangat jauh (${distance.toFixed(2)} km)`);
      confidence = 'low';
      recommendations.push('Pastikan Anda berada di lokasi tower yang benar');
      recommendations.push('Coba refresh lokasi atau restart GPS');
    }
  }

  // Check for zero coordinates
  if (coordinates.latitude === 0 && coordinates.longitude === 0) {
    issues.push('Koordinat menunjukkan lokasi default (0,0)');
    confidence = 'low';
    recommendations.push('GPS tidak dapat menentukan lokasi');
  }

  return {
    isValid: issues.length === 0,
    confidence,
    issues,
    recommendations
  };
}

/**
 * Get location with advanced GPS calibration and multiple fallback strategies
 */
export async function getAdvancedLocation(
  towerCoordinates?: Coordinates,
  maxAttempts: number = 5
): Promise<{
  success: boolean;
  coordinates?: Coordinates;
  accuracy?: number;
  diagnostics?: GPSDiagnostics;
  validation?: LocationValidationResult;
  message: string;
  attemptsUsed: number;
}> {
  const attempts: Array<Promise<GeolocationPosition>> = [];
  
  // Strategy 1: Ultra-high accuracy GPS (optimized timeout)
  attempts.push(new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000, // Reduced from 45s to 15s for faster response
        maximumAge: 30000 // Allow 30s cached data for speed
      }
    );
  }));

  // Strategy 2: High accuracy with moderate timeout (optimized)
  attempts.push(new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000, // Reduced from 30s to 10s
        maximumAge: 60000 // Increased from 10s to 60s to prefer cached
      }
    );
  }));

  // Strategy 3: Balanced accuracy (optimized)
  attempts.push(new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: 8000, // Reduced from 20s to 8s
        maximumAge: 120000 // Increased from 60s to 120s (2 minutes)
      }
    );
  }));

  // Strategy 4: Fast network-based location (optimized)
  attempts.push(new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: 5000, // Reduced from 15s to 5s
        maximumAge: 300000 // 5 minutes max age (unchanged)
      }
    );
  }));

  // Strategy 5: Emergency fallback with cached data
  attempts.push(new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: 10000, // 10 seconds
        maximumAge: 600000 // 10 minutes max age
      }
    );
  }));

  let bestResult: GeolocationPosition | null = null;
  let bestAccuracy = Infinity;
  let attemptsUsed = 0;

  // Try each strategy
  for (let i = 0; i < Math.min(attempts.length, maxAttempts); i++) {
    attemptsUsed++;
    
    try {
      const result = await Promise.race([
        attempts[i],
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Strategy timeout')), 50000)
        )
      ]);

      const diagnostics = getGPSDiagnostics(result);
      
      // If this result is better than our current best, use it
      if (result.coords.accuracy < bestAccuracy) {
        bestResult = result;
        bestAccuracy = result.coords.accuracy;
        
        // If we get acceptable accuracy (better than 200m), use it immediately for speed
        if (result.coords.accuracy <= 200) {
          break;
        }
      }

      // Reduced delay between attempts for faster response
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 3s to 1s
      }

    } catch (error) {
      console.warn(`Location strategy ${i + 1} failed:`, error);
      continue;
    }
  }

  if (!bestResult) {
    return {
      success: false,
      message: 'Semua strategi lokasi gagal. Pastikan GPS aktif dan izin lokasi diizinkan.',
      attemptsUsed
    };
  }

  const coordinates: Coordinates = {
    latitude: bestResult.coords.latitude,
    longitude: bestResult.coords.longitude
  };

  const diagnostics = getGPSDiagnostics(bestResult);
  const validation = validateLocationQuality(coordinates, bestResult.coords.accuracy, towerCoordinates);

  // Generate appropriate message based on validation
  let message = 'Lokasi berhasil diperoleh';
  if (validation.confidence === 'low') {
    message = `Lokasi diperoleh dengan akurasi rendah (±${Math.round(bestResult.coords.accuracy)}m). ${validation.recommendations[0] || ''}`;
  } else if (validation.confidence === 'medium') {
    message = `Lokasi diperoleh dengan akurasi sedang (±${Math.round(bestResult.coords.accuracy)}m)`;
  } else {
    message = `Lokasi diperoleh dengan akurasi tinggi (±${Math.round(bestResult.coords.accuracy)}m)`;
  }

  return {
    success: true,
    coordinates,
    accuracy: bestResult.coords.accuracy,
    diagnostics,
    validation,
    message,
    attemptsUsed
  };
}

/**
 * Assess location quality based on accuracy and other factors
 * @param accuracy GPS accuracy in meters
 * @param coordinates Location coordinates
 * @returns Quality assessment object
 */
export function assessLocationQuality(accuracy: number | undefined, coordinates: Coordinates): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  recommendation: string;
} {
  if (!accuracy) {
    return {
      quality: 'fair',
      message: 'Akurasi lokasi tidak diketahui',
      recommendation: 'Pastikan GPS aktif dan sinyal baik'
    };
  }

  if (accuracy <= 10) {
    return {
      quality: 'excellent',
      message: 'Akurasi sangat tinggi (±10m)',
      recommendation: 'Lokasi sangat akurat, cocok untuk pelaporan'
    };
  } else if (accuracy <= 50) {
    return {
      quality: 'good',
      message: 'Akurasi baik (±50m)',
      recommendation: 'Lokasi cukup akurat untuk pelaporan'
    };
  } else if (accuracy <= 200) {
    return {
      quality: 'good',
      message: 'Akurasi cukup baik (±200m)',
      recommendation: 'Lokasi dapat digunakan untuk pelaporan'
    };
  } else if (accuracy <= 500) {
    return {
      quality: 'fair',
      message: 'Akurasi sedang (±500m)',
      recommendation: 'Lokasi dapat digunakan, namun akurasi terbatas'
    };
  } else {
    return {
      quality: 'poor',
      message: 'Akurasi rendah (±500m+)',
      recommendation: 'Pindah ke area dengan sinyal GPS lebih baik atau gunakan WiFi'
    };
  }
}

/**
 * Get location with user-friendly feedback and retry options
 * @param maxRetries Maximum number of retry attempts
 * @param forceFresh Force fresh location data (useful for account switching)
 * @returns Promise with enhanced location result
 */
export async function getLocationWithFeedback(maxRetries: number = 3, forceFresh: boolean = false): Promise<{
  success: boolean;
  coordinates?: Coordinates;
  accuracy?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  recommendation?: string;
}> {
  try {
    const locationResult = await getCurrentLocationEnhanced(maxRetries, forceFresh);
    
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
    
    const qualityAssessment = assessLocationQuality(
      locationResult.accuracy,
      locationResult.coordinates
    );
    
    return {
      success: true,
      coordinates: locationResult.coordinates,
      accuracy: locationResult.accuracy,
      quality: qualityAssessment.quality,
      message: qualityAssessment.message,
      recommendation: qualityAssessment.recommendation
    };
  } catch (error) {
    return {
      success: false,
      message: 'Terjadi kesalahan saat mendapatkan lokasi'
    };
  }
}

/**
 * Detect if user has switched accounts and needs fresh location
 * @param currentUserId Current user ID
 * @returns Boolean indicating if fresh location is needed
 */
export function shouldUseFreshLocation(currentUserId: string | number | null): boolean {
  try {
    const lastUserId = localStorage.getItem('lastLocationUserId');
    const currentUserIdStr = currentUserId?.toString() || 'anonymous';
    
    if (lastUserId !== currentUserIdStr) {
      // User has changed, store new user ID and return true
      localStorage.setItem('lastLocationUserId', currentUserIdStr);
      return true;
    }
    
    // Check if location data is stale (older than 5 minutes)
    const lastLocationData = localStorage.getItem('lastKnownLocation');
    if (lastLocationData) {
      try {
        const parsed = JSON.parse(lastLocationData);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        if (parsed.timestamp && parsed.timestamp < fiveMinutesAgo) {
          return true;
        }
      } catch (error) {
        // If we can't parse the data, assume it's stale
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // If there's any error, assume we need fresh location
    return true;
  }
}

/**
 * Get location optimized for account switching scenarios with advanced GPS calibration
 * @param currentUserId Current user ID
 * @param towerCoordinates Optional tower coordinates for validation
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with enhanced location result
 */
export async function getLocationForAccountSwitching(
  currentUserId: string | number | null,
  towerCoordinates?: Coordinates,
  maxRetries: number = 5
): Promise<{
  success: boolean;
  coordinates?: Coordinates;
  accuracy?: number;
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  recommendation?: string;
  isFreshLocation?: boolean;
  diagnostics?: GPSDiagnostics;
  validation?: LocationValidationResult;
  attemptsUsed?: number;
}> {
  const needsFreshLocation = shouldUseFreshLocation(currentUserId);
  
  if (needsFreshLocation) {
    // Clear any cached location data
    clearLocationCache();
  }
  
  // Use advanced location capture with tower coordinates for validation
  const result = await getAdvancedLocation(towerCoordinates, maxRetries);
  
  if (!result.success) {
    return {
      success: false,
      message: result.message,
      isFreshLocation: needsFreshLocation,
      attemptsUsed: result.attemptsUsed
    };
  }
  
  // Convert validation confidence to quality
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  if (result.validation) {
    switch (result.validation.confidence) {
      case 'low':
        quality = 'poor';
        break;
      case 'medium':
        quality = 'fair';
        break;
      case 'high':
        quality = result.accuracy && result.accuracy <= 20 ? 'excellent' : 'good';
        break;
    }
  }
  
  // Generate comprehensive message
  let message = result.message;
  let recommendation = '';
  
  if (result.validation && result.validation.issues.length > 0) {
    recommendation = result.validation.recommendations.join('. ');
  }
  
  return {
    success: true,
    coordinates: result.coordinates,
    accuracy: result.accuracy,
    quality,
    message,
    recommendation: recommendation || undefined,
    isFreshLocation: needsFreshLocation,
    diagnostics: result.diagnostics,
    validation: result.validation,
    attemptsUsed: result.attemptsUsed
  };
}

/**
 * Check if tower has valid coordinates
 * @param tower Tower object to check
 * @returns Boolean indicating if tower has valid coordinates
 */
export function hasValidTowerCoordinates(tower: any): boolean {
  return tower && 
         tower.latitude && 
         tower.longitude && 
         !isNaN(Number(tower.latitude)) && 
         !isNaN(Number(tower.longitude)) &&
         Number(tower.latitude) !== 0 && 
         Number(tower.longitude) !== 0;
}