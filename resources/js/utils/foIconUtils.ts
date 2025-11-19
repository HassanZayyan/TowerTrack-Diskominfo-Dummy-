/**
 * Utility functions for FO Point icons with side of road indicator
 */

import L from 'leaflet';

/**
 * Side of road type
 */
export type SideOfRoad = 'left' | 'right' | 'unknown' | null | undefined;

/**
 * Interface for FO point images
 */
export interface FoPointImages {
  isp: string | null;
  pole: string | null;
  junction_box: string | null;
}

/**
 * Create custom icon with side of road indicator
 * 
 * Visual Strategy:
 * - Border color: Blue for left, Red for right, Gray for unknown
 * - Badge indicator: Small "L" or "R" in corner for clarity
 * - Thicker border (3px) for better visibility
 */
export const createCustomIconWithSide = (
  color: string,
  iconText: string,
  sideOfRoad?: SideOfRoad
): L.DivIcon => {
  // Determine border color based on side
  const borderColor = sideOfRoad === 'left' 
    ? '#3B82F6'    // Blue for left
    : sideOfRoad === 'right' 
    ? '#EF4444'     // Red for right
    : '#6B7280';   // Gray for unknown/null

  // Badge indicator (small text in corner)
  const badge = sideOfRoad === 'left' 
    ? '<span style="position: absolute; top: -2px; left: -2px; background: #3B82F6; color: white; font-size: 6px; font-weight: bold; padding: 1px 2px; border-radius: 2px; line-height: 1;">L</span>'
    : sideOfRoad === 'right'
    ? '<span style="position: absolute; top: -2px; right: -2px; background: #EF4444; color: white; font-size: 6px; font-weight: bold; padding: 1px 2px; border-radius: 2px; line-height: 1;">R</span>'
    : '';

  const iconHtml = `
    <div style="
      position: relative;
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: white;
      font-weight: bold;
      font-family: Arial, sans-serif;
    ">
      ${iconText}
      ${badge}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-fo-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

/**
 * Get icon by images and side of road
 * This is the enhanced version that includes side indicator
 */
export const getIconByImagesAndSide = (
  images: FoPointImages,
  sideOfRoad?: SideOfRoad
) => {
  // Check if images exist
  const hasPole = !!images.pole && images.pole !== '-' && images.pole.trim() !== '';
  const hasISP = !!images.isp && images.isp !== '-' && images.isp.trim() !== '';
  const hasJunctionBox = !!images.junction_box && images.junction_box !== '-' && images.junction_box.trim() !== '';

  // 1. Ada tiang, ISP dan Joint Box -> pole ISP Joint Box (icon = PIJ) - Ungu
  if (hasPole && hasISP && hasJunctionBox) {
    return createCustomIconWithSide('#8B5CF6', 'PIJ', sideOfRoad);
  }

  // 2. Ada tiang dan ISP -> pole and ISP (icon = PI) - Hijau
  if (hasPole && hasISP && !hasJunctionBox) {
    return createCustomIconWithSide('#10B981', 'PI', sideOfRoad);
  }

  // 3. Ada tiang dan Joint Box -> Joint Box (icon = JB) - Orange
  if (hasPole && !hasISP && hasJunctionBox) {
    return createCustomIconWithSide('#F59E0B', 'JB', sideOfRoad);
  }

  // 4. Hanya ada gambar tiang -> pole (icon = P) - Biru
  if (hasPole && !hasISP && !hasJunctionBox) {
    return createCustomIconWithSide('#3B82F6', 'P', sideOfRoad);
  }

  // 5. Hanya ada ISP tanpa tiang -> ISP saja (icon = I) - Cyan
  if (!hasPole && hasISP && !hasJunctionBox) {
    return createCustomIconWithSide('#06B6D4', 'I', sideOfRoad);
  }

  // 6. Hanya ada Joint Box tanpa tiang -> JB saja (icon = J) - Amber
  if (!hasPole && !hasISP && hasJunctionBox) {
    return createCustomIconWithSide('#F59E0B', 'J', sideOfRoad);
  }

  // 7. Ada ISP dan Joint Box tanpa tiang -> ISP + JB (icon = IJ) - Pink
  if (!hasPole && hasISP && hasJunctionBox) {
    return createCustomIconWithSide('#EC4899', 'IJ', sideOfRoad);
  }

  // Default untuk kasus lain - Abu-abu
  return createCustomIconWithSide('#6B7280', '?', sideOfRoad);
};

/**
 * Get label for side of road (for display)
 */
export const getSideOfRoadLabel = (sideOfRoad?: SideOfRoad): string => {
  switch (sideOfRoad) {
    case 'left':
      return 'Kiri';
    case 'right':
      return 'Kanan';
    case 'unknown':
      return 'Belum Diketahui';
    default:
      return 'Belum Diketahui';
  }
};

/**
 * Get color for side of road (for UI elements)
 */
export const getSideOfRoadColor = (sideOfRoad?: SideOfRoad): string => {
  switch (sideOfRoad) {
    case 'left':
      return '#3B82F6'; // Blue
    case 'right':
      return '#EF4444'; // Red
    case 'unknown':
      return '#6B7280'; // Gray
    default:
      return '#6B7280'; // Gray
  }
};

