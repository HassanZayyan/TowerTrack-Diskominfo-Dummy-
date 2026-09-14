/**
 * Utility functions for FO Point icons with side of road indicator
 */

import L from 'leaflet';
import { SIDE_OF_ROAD_STYLES, ROUTE_CASING, foPointStyle } from '@/lib/map-palette';

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
 * Which of the eight categories a point falls into, from the photographs it has.
 *
 * ONE copy of this decision. It used to exist twice — once in
 * `createFoMarkerIcon` and once in `getIconByImagesAndSide` — as two parallel
 * if/else ladders that each had to name a colour alongside the code. That fork
 * is how the map-palette note's original bug happened: both ladders assigned
 * #F59E0B, so 'JB' and 'J' drew identically while the comments claimed they
 * differed. With the colour looked up from the code, and the code decided here,
 * the two can no longer disagree.
 *
 * A dash is what the source CSV writes for "no photograph", so it counts as
 * absent rather than as a filename.
 */
const has = (value: string | null): boolean =>
  typeof value === 'string' && value.trim() !== '' && value.trim() !== '-';

export const foPointCode = (images: FoPointImages): string => {
  const pole = has(images.pole);
  const isp = has(images.isp);
  const jb = has(images.junction_box);

  if (pole && isp && jb) return 'PIJ';
  if (pole && isp) return 'PI';
  if (pole && jb) return 'JB';
  if (pole) return 'P';
  if (isp && jb) return 'IJ';
  if (isp) return 'I';
  if (jb) return 'J';
  return '?';
};

/**
 * Create custom icon with side of road indicator
 * 
 * Visual Strategy:
 * - Border colour is neutral for both sides; the L/R badge carries the meaning
 * - Badge indicator: Small "L" or "R" in corner for clarity
 * - Thicker border (3px) for better visibility
 */
/**
 * Built icons, keyed by the three things that shape one.
 *
 * Eight point types times three road sides is twenty-four possible markers, and
 * /data-fo draws two hundred of them. Without this the same two dozen SVG
 * strings were assembled two hundred times per render. Sharing an L.DivIcon
 * between markers is safe — DivIcon.createIcon() builds a fresh element per
 * marker from the stored html.
 */
const foIconCache = new Map<string, L.DivIcon>();

/**
 * The side-of-road badge, built once and used by both icon builders.
 *
 * WHY IT IS A LIGHT/DARK PAIR NOW.
 *
 * Both badges used to be the same dark neutral, differing only in the letter
 * and in which corner they sat. At 6px, on a map where the points run in dense
 * chains along a road, "L" and "R" are the same small mark. The reader has to
 * already know the corner rule before the corner tells them anything.
 *
 * Now `left` is white-on-ink and `right` is ink-on-white — the largest
 * difference two marks of the same size can carry, readable at a glance and
 * unaffected by any form of colour blindness. Each carries the opposite ring
 * colour, so neither dissolves into the tile behind it. The letter and the
 * corner stay, which makes four channels saying the same thing.
 *
 * 7px rather than 6px, and a minimum width, so the two badges are the same
 * shape as each other and not merely the same idea.
 */
const sideBadge = (sideOfRoad: SideOfRoad): string => {
  if (sideOfRoad !== 'left' && sideOfRoad !== 'right') return '';
  const style = SIDE_OF_ROAD_STYLES[sideOfRoad];
  const edge = sideOfRoad === 'left' ? 'left' : 'right';
  return (
    `<span style="position: absolute; top: -4px; ${edge}: -4px;` +
    ` background: ${style.fill}; color: ${style.ink}; font-size: 7px;` +
    ' font-weight: 700; line-height: 11px; min-width: 11px; text-align: center;' +
    ' padding: 0 1px; border-radius: 4px; font-family: Arial, sans-serif;' +
    ` box-shadow: 0 0 0 1.5px ${style.ring}, 0 1px 2px rgba(28,25,23,0.3);">` +
    `${sideOfRoad === 'left' ? 'L' : 'R'}</span>`
  );
};

/**
 * @param iconText the category code the marker displays — 'PIJ', 'P', '?'.
 *   The fill and the text colour are both derived from it, so a marker cannot
 *   end up with one category's colour and another's letters.
 */
export const createCustomIconWithSide = (
  iconText: string,
  sideOfRoad?: SideOfRoad
): L.DivIcon => {
  const cacheKey = `${iconText}|${sideOfRoad ?? '-'}`;
  const cached = foIconCache.get(cacheKey);
  if (cached) return cached;

  const { fill, ink } = foPointStyle(iconText);

  // WHITE CASING, NOT A DARK RING.
  //
  // Every marker used to be ringed in 3px of MAP_SIDE_COLOR — a dark neutral
  // taking up a quarter of a 24px disc. One of those is unobtrusive; the FO
  // points run in dense chains along a road, and a few dozen overlapping dark
  // rings merged into a charcoal mass that swallowed the category colours
  // entirely. The map looked black.
  //
  // A white casing is the standard cartographic answer, and it is what
  // ROUTE_CASING already does for the polylines: it separates a marker from the
  // basemap and from its neighbours while adding no visual weight of its own.
  // Side of road is left to the badge, which is what the comment here always
  // said was carrying it.
  const borderColor = ROUTE_CASING;

  const badge = sideBadge(sideOfRoad);

  const iconHtml = `
    <div style="
      position: relative;
      background-color: ${fill};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid ${borderColor};
      box-shadow: 0 1px 3px rgba(28,25,23,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: ${ink};
      font-weight: bold;
      font-family: Arial, sans-serif;
    ">
      ${iconText}
      ${badge}
    </div>
  `;

  const icon = L.divIcon({
    html: iconHtml,
    className: 'custom-fo-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });

  foIconCache.set(cacheKey, icon);
  return icon;
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
 * - Selected: gold ring + scale. Not red: red means 'non-aktif' on this map.
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
  const iconText = foPointCode(images);
  const { fill, ink } = foPointStyle(iconText);

  // White casing, same reasoning as createCustomIconWithSide above: a dark ring
  // on every marker turned dense chains of FO points into one charcoal mass.
  const borderColor = ROUTE_CASING;

  const badge = sideBadge(sideOfRoad);

  // Adjust styling based on state
  const borderWidth = state === 'selected' ? 3 : 2;
  const shadowIntensity = state === 'selected' ? 0.45 : 0.28;
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
          border: 3px solid #AA8400;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(170, 132, 0, 0.35);
        "></div>
        <div style="
          position: relative;
          background-color: ${fill};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${borderWidth}px solid ${borderColor};
          box-shadow: 0 2px 8px rgba(0,0,0,${shadowIntensity});
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: ${ink};
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
        background-color: ${fill};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: 0 2px 8px rgba(0,0,0,${shadowIntensity});
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: ${ink};
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
  // The ladder that used to live here is gone: it named a colour beside every
  // code, which is exactly the pairing foPointCode + foPointStyle exists to
  // make impossible. The comments it carried ("- Ungu", "- Biru", "- Amber")
  // had also drifted away from the colours actually being drawn.
  return createCustomIconWithSide(foPointCode(images), sideOfRoad);
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
export const getSideOfRoadColor = (sideOfRoad?: SideOfRoad): string =>
  getSideOfRoadStyle(sideOfRoad).fill;

/**
 * Fill, text and ring for a side of road — the same three values the map badge
 * uses, so a badge anywhere else in the interface matches the one on the map.
 */
export const getSideOfRoadStyle = (
  sideOfRoad?: SideOfRoad,
): { fill: string; ink: string; ring: string } =>
  sideOfRoad === 'left' || sideOfRoad === 'right'
    ? SIDE_OF_ROAD_STYLES[sideOfRoad]
    : SIDE_OF_ROAD_STYLES.unknown;

