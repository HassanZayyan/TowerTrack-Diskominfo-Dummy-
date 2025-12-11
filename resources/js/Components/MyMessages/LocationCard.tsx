import React from 'react';
import type { Tower, FoPoint } from '@/types/messages';

// Union type for location (can be Tower, FoPoint, or polymorphic object)
type Location = Tower | FoPoint | { id: number; site_name?: string; name?: string; alamat_menara?: string; description?: string; area?: string } | null;

type LocationCardProps = {
  tower?: Tower | null;
  foPoint?: FoPoint | null;
  reportable?: Location;
  feedbackable?: Location;
  reportableType?: string | null;
  feedbackableType?: string | null;
};

/**
 * Reusable component to display location information (Tower or Fiber Optik)
 * Supports both legacy (tower/foPoint) and polymorphic (reportable/feedbackable) formats
 */
export default function LocationCard({
  tower,
  foPoint,
  reportable,
  feedbackable,
  reportableType,
  feedbackableType,
}: LocationCardProps) {
  // Determine location type and data
  // Priority: reportable/feedbackable > tower/foPoint (for backward compatibility)
  const location = reportable || feedbackable || tower || foPoint;
  const locationType = reportableType || feedbackableType;
  
  // Check if it's a FoPoint
  const isFoPoint = 
    locationType === 'App\\Models\\FoPoint' ||
    (location && 'name' in location && !('site_name' in location)) ||
    Boolean(foPoint);
  
  // Check if it's a Tower
  const isTower = 
    locationType === 'App\\Models\\Tower' ||
    (location && 'site_name' in location) ||
    Boolean(tower);
  
  // Get display values - handle polymorphic types
  const locationName = isTower 
    ? (location as any)?.site_name 
    : (location as any)?.name;
  
  const locationAddress = isTower 
    ? (location as any)?.alamat_menara 
    : (location as any)?.description || (location as any)?.area;
  
  const label = isFoPoint ? 'Lokasi Fiber Optik' : 'Lokasi Tower';
  
  // Icon for Fiber Optik (different from Tower)
  const locationIcon = isFoPoint ? (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 bg-gradient-to-br rounded-lg shadow-sm ${
          isFoPoint 
            ? 'from-blue-500 to-blue-600' 
            : 'from-indigo-500 to-indigo-600'
        }`}>
          {locationIcon}
        </div>
        <h5 className="text-sm font-bold text-gray-900">{label}</h5>
      </div>
      <div className="font-semibold text-gray-900 text-base mb-1">
        {locationName ?? '-'}
      </div>
      {locationAddress && (
        <div className="text-sm text-gray-600 flex items-start gap-1">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {locationAddress}
        </div>
      )}
    </div>
  );
}

