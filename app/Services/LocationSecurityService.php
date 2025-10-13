<?php

namespace App\Services;

class LocationSecurityService
{
    /**
     * Validate and sanitize coordinate data
     *
     * @param float $latitude
     * @param float $longitude
     * @param float|null $accuracy
     * @return array
     */
    public static function validateCoordinates(float $latitude, float $longitude, ?float $accuracy = null): array
    {
        // Validate coordinate ranges
        if ($latitude < -90 || $latitude > 90) {
            throw new \InvalidArgumentException('Invalid latitude range');
        }
        
        if ($longitude < -180 || $longitude > 180) {
            throw new \InvalidArgumentException('Invalid longitude range');
        }
        
        // Round coordinates to appropriate precision (6 decimal places = ~11cm accuracy)
        $sanitizedLatitude = round($latitude, 6);
        $sanitizedLongitude = round($longitude, 6);
        
        // Validate accuracy if provided
        $sanitizedAccuracy = null;
        if ($accuracy !== null) {
            if ($accuracy < 0 || $accuracy > 10000) { // Max 10km accuracy (more flexible for documentation purposes)
                throw new \InvalidArgumentException('Invalid accuracy value');
            }
            $sanitizedAccuracy = round($accuracy, 2);
        }
        
        $result = [
            'reporter_latitude' => $sanitizedLatitude,
            'reporter_longitude' => $sanitizedLongitude,
            'location_captured_at' => now()
        ];
        
        // Only include accuracy if it's provided and valid
        if ($sanitizedAccuracy !== null) {
            $result['reporter_accuracy'] = $sanitizedAccuracy;
        }
        
        return $result;
    }
    
    /**
     * Check if coordinates are within reasonable bounds for Indonesia
     * This helps detect obviously fake coordinates
     *
     * @param float $latitude
     * @param float $longitude
     * @return bool
     */
    public static function isWithinIndonesiaBounds(float $latitude, float $longitude): bool
    {
        // Indonesia approximate bounds
        $minLat = -11.0; // Southernmost point
        $maxLat = 6.0;   // Northernmost point
        $minLon = 95.0;  // Westernmost point
        $maxLon = 141.0; // Easternmost point
        
        return $latitude >= $minLat && $latitude <= $maxLat &&
               $longitude >= $minLon && $longitude <= $maxLon;
    }
    
    /**
     * Calculate distance between two coordinates
     * Used for validation and analysis
     *
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distance in kilometers
     */
    public static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
    
    /**
     * Anonymize coordinates for public display
     * Reduces precision to protect privacy while maintaining usefulness
     *
     * @param float $latitude
     * @param float $longitude
     * @return array
     */
    public static function anonymizeCoordinates(float $latitude, float $longitude): array
    {
        // Reduce to 2 decimal places (~1km precision)
        return [
            'latitude' => round($latitude, 2),
            'longitude' => round($longitude, 2)
        ];
    }
    
    /**
     * Check if location data should be considered suspicious
     *
     * @param float $latitude
     * @param float $longitude
     * @param float|null $accuracy
     * @return array
     */
    public static function analyzeLocationRisk(float $latitude, float $longitude, ?float $accuracy = null): array
    {
        $risks = [];
        
        // Check if within Indonesia bounds
        if (!self::isWithinIndonesiaBounds($latitude, $longitude)) {
            $risks[] = 'coordinates_outside_indonesia';
        }
        
        // Check for obviously fake coordinates (exact zeros, common test coordinates)
        if ($latitude == 0 && $longitude == 0) {
            $risks[] = 'zero_coordinates';
        }
        
        // Check for very low accuracy (might indicate GPS spoofing)
        if ($accuracy !== null && $accuracy < 1) {
            $risks[] = 'suspiciously_high_accuracy';
        }
        
        // Check for very high accuracy (might indicate fake location)
        if ($accuracy !== null && $accuracy > 100) {
            $risks[] = 'very_low_accuracy';
        }
        
        return [
            'is_suspicious' => !empty($risks),
            'risk_factors' => $risks,
            'risk_level' => empty($risks) ? 'low' : (count($risks) > 2 ? 'high' : 'medium')
        ];
    }
}
