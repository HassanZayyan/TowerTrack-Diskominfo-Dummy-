/**
 * Utility functions for Tower marker icons with visual feedback
 * DRY: Centralized icon creation for tower selection feedback
 */

import L from 'leaflet';

/**
 * Tower marker icon state
 */
export type TowerMarkerState = 'default' | 'selected' | 'measurement';

/**
 * Color configuration for tower markers
 */
const TOWER_ICON_COLORS = {
  default: '#2563EB',  // Blue - default state
  selected: '#DC2626', // Red - selected state
  measurement: '#DC2626', // Red - measurement mode (selected markers red)
} as const;

/**
 * Create custom tower marker icon
 * 
 * Visual Strategy:
 * - Default: Blue circle with white center dot
 * - Selected: Red circle with white center dot and thicker border
 * - Measurement: Red circle (selected markers red when measurement mode is active)
 * 
 * @param state - The visual state of the marker
 * @param size - Icon size in pixels (default: 30)
 * @returns Leaflet DivIcon instance
 */
export const createTowerMarkerIcon = (
  state: TowerMarkerState = 'default',
  size: number = 30
): L.DivIcon => {
  const color = TOWER_ICON_COLORS[state];
  const borderWidth = (state === 'selected' || state === 'measurement') ? 4 : 3;
  const shadowIntensity = (state === 'selected' || state === 'measurement') ? 0.4 : 0.3;
  const centerDotSize = Math.max(10, size * 0.4);

  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: ${borderWidth}px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,${shadowIntensity});
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      ${(state === 'selected' || state === 'measurement') ? 'transform: scale(1.1);' : ''}
    ">
      <div style="
        width: ${centerDotSize}px;
        height: ${centerDotSize}px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `;

  const anchor = size / 2;

  return L.divIcon({
    className: `custom-tower-marker custom-tower-marker-${state}`,
    html: iconHtml,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor]
  });
};

/**
 * Check if a tower marker should be highlighted
 * 
 * @param towerId - The tower ID to check
 * @param selectedTowerId - The currently selected tower ID
 * @returns boolean indicating if tower should be highlighted
 */
export const isTowerSelected = (
  towerId: string | number | null | undefined,
  selectedTowerId: string | number | null | undefined
): boolean => {
  if (!towerId || !selectedTowerId) return false;
  return towerId.toString() === selectedTowerId.toString();
};

