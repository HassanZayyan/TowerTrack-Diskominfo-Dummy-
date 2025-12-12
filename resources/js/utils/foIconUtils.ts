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
 * FO marker icon state (for selection feedback)
 */
export type FoMarkerState = 'default' | 'selected';

/**
 * Create FO marker icon with selection state
 * Similar to towerIconUtils but for FO points with visual feedback
 * 
 * Visual Strategy:
 * - Default: Normal icon from getIconByImagesAndSide
 * - Selected: Same icon but with thicker border, shadow, and scale effect
 * 
 * @param images - FO point images
 * @param sideOfRoad - Side of road indicator
 * @param state - The visual state of the marker ('default' or 'selected')
 * @param size - Icon size in pixels (default: 24)
 * @returns Leaflet DivIcon instance
 */
export const createFoMarkerIcon = (
  images: FoPointImages,
  sideOfRoad?: SideOfRoad,
  state: FoMarkerState = 'default',
  size: number = 24
): L.DivIcon => {
  // Get base icon configuration from getIconByImagesAndSide logic
  const hasPole = !!images.pole && images.pole !== '-' && typeof images.pole === 'string' && images.pole.trim() !== '';
  const hasISP = !!images.isp && images.isp !== '-' && typeof images.isp === 'string' && images.isp.trim() !== '';
  const hasJunctionBox = !!images.junction_box && images.junction_box !== '-' && typeof images.junction_box === 'string' && images.junction_box.trim() !== '';

  // Determine color and text based on images (same logic as getIconByImagesAndSide)
  let color = '#6B7280'; // Default gray
  let iconText = '?';

  if (hasPole && hasISP && hasJunctionBox) {
    color = '#8B5CF6'; // Purple
    iconText = 'PIJ';
  } else if (hasPole && hasISP && !hasJunctionBox) {
    color = '#10B981'; // Green
    iconText = 'PI';
  } else if (hasPole && !hasISP && hasJunctionBox) {
    color = '#F59E0B'; // Orange
    iconText = 'JB';
  } else if (hasPole && !hasISP && !hasJunctionBox) {
    color = '#3B82F6'; // Blue
    iconText = 'P';
  } else if (!hasPole && hasISP && !hasJunctionBox) {
    color = '#06B6D4'; // Cyan
    iconText = 'I';
  } else if (!hasPole && !hasISP && hasJunctionBox) {
    color = '#F59E0B'; // Amber
    iconText = 'J';
  } else if (!hasPole && hasISP && hasJunctionBox) {
    color = '#EC4899'; // Pink
    iconText = 'IJ';
  }

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

  // Adjust styling based on state
  const borderWidth = state === 'selected' ? 5 : 3;
  const shadowIntensity = state === 'selected' ? 0.5 : 0.3;
  const scale = state === 'selected' ? 1.15 : 1;
  const ringSize = size + 12;
  
  // For selected state, wrap in container with red ring
  const iconHtml = state === 'selected' 
    ? `
      <div style="
        position: relative;
        width: ${ringSize}px;
        height: ${ringSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: ${ringSize}px;
          height: ${ringSize}px;
          border: 3px solid #DC2626;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.3);
        "></div>
        <div style="
          position: relative;
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${borderWidth}px solid ${borderColor};
          box-shadow: 0 2px 8px rgba(0,0,0,${shadowIntensity});
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          font-weight: bold;
          font-family: Arial, sans-serif;
          transform: scale(${scale});
        ">
          ${iconText}
          ${badge}
        </div>
      </div>
    `
    : `
      <div style="
        position: relative;
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: 0 2px 8px rgba(0,0,0,${shadowIntensity});
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

  const iconSizeValue = state === 'selected' ? ringSize : size;
  const anchor = iconSizeValue / 2;

  return L.divIcon({
    html: iconHtml,
    className: `custom-fo-icon custom-fo-icon-${state}`,
    iconSize: [iconSizeValue, iconSizeValue],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor]
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
  // Check if images exist (handle null/undefined safely)
  const hasPole = !!images.pole && images.pole !== '-' && typeof images.pole === 'string' && images.pole.trim() !== '';
  const hasISP = !!images.isp && images.isp !== '-' && typeof images.isp === 'string' && images.isp.trim() !== '';
  const hasJunctionBox = !!images.junction_box && images.junction_box !== '-' && typeof images.junction_box === 'string' && images.junction_box.trim() !== '';

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

