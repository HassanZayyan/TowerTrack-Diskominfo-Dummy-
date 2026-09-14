/**
 * Utility functions for Tower marker icons with visual feedback
 * DRY: Centralized icon creation for tower selection feedback
 */

import L from 'leaflet';

/**
 * Tower marker icon state
 */
export type TowerMarkerState = 'default' | 'selected' | 'measurement';

import { TOWER_ICON_COLORS as PALETTE } from '@/lib/map-palette';

/**
 * Color configuration for tower markers.
 *
 * Sourced from @/lib/map-palette so the map has one colour authority.
 *
 * What changed and why:
 * - default was #2563EB, which is brand-600. With a blue application chrome
 *   every ordinary tower read as UI rather than as data. It is now a neutral
 *   ink-700, so the map's only saturated marks are the ones that mean something.
 * - selected was #DC2626, the same red as "tower non-aktif" — selection and
 *   failure were indistinguishable. It is now dark Sun Gold, which is dE 35.8
 *   from the brand and dE 28.5 from the default pin, and is reinforced by scale
 *   so colour is not the only channel.
 * - measurement was also #DC2626. Measuring is a tool, not an error.
 */
const TOWER_ICON_COLORS = {
  default: PALETTE.default,
  selected: PALETTE.selected,
  measurement: PALETTE.measurement,
} as const;

/**
 * Create custom tower marker icon.
 *
 * A LATTICE MAST, NOT A DOT.
 *
 * It used to be a filled circle with a white dot in the middle — the generic
 * "a thing is here" marker, which on a page whose entire subject is towers said
 * nothing at all. It is now a small isometric mast: two tapering legs, three
 * cross braces, a headframe and a tip, standing on its own ground shadow.
 *
 * Drawn as inline SVG rather than an image file. It costs no request, it scales
 * to any device pixel ratio, and its colour comes from the same palette
 * everything else on the map reads.
 *
 * WHY IT IS ANCHORED AT THE FOOT.
 *
 * A circle is anchored at its centre because a circle has no bottom. A tower
 * does: the coordinate is where it is planted, so the base of the mast has to
 * sit on that point or every marker reads as floating half a tower too high.
 *
 * Detail is deliberately coarse. At 30px a faithful lattice turns to mush, so
 * the bracing is three strokes that suggest a truss rather than depict one.
 *
 * @param state - The visual state of the marker
 * @param size - Icon height in pixels (default: 30)
 * @returns Leaflet DivIcon instance
 */
/**
 * Built icons, keyed by state and size.
 *
 * There are three states and one size in practice, so the map was assembling
 * the same three SVG strings once per marker — about 120 times on /data-tower,
 * every time the marker set changed. Sharing one L.DivIcon between markers is
 * safe: Leaflet's DivIcon.createIcon() builds a fresh element per marker from
 * the stored html, so the instance holds no per-marker state.
 */
const iconCache = new Map<string, L.DivIcon>();

/**
 * The mast itself, as an SVG string.
 *
 * EXPORTED SO THE LEGEND CAN DRAW THE SAME THING.
 *
 * The legend on /data-tower was a filled circle with a white dot — the marker
 * this file used to build, left behind when the marker became a mast. A legend
 * that shows a different shape from the map is worse than no legend: it is a
 * caption for a picture that is not there, and the reader trusts it.
 *
 * Geometry in a 24 x 32 box, scaled by the viewBox. The mast tapers from a
 * 16-unit base to a 6-unit head, which is roughly the proportion of a real
 * self-supporting tower and reads as perspective even though the drawing is
 * flat.
 *
 * The white strokes underneath are a CASING: drawn first and thicker than the
 * coloured strokes on top, so the mast keeps its shape over dark forest, pale
 * farmland and the blue of Rawa Pening alike. Without it a 1.7px line
 * disappears into whatever tile it happens to land on. `withShadow` turns off
 * the ground ellipse for the legend, where there is no ground to cast onto.
 */
export const towerMastSvg = (
  color: string,
  width: number,
  height: number,
  withShadow = true,
): string => `
    <svg viewBox="0 0 24 32" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${withShadow ? '<ellipse cx="12" cy="29.6" rx="6.4" ry="1.9" fill="#1C1917" fill-opacity="0.16"/>' : ''}
      <g fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.5 29 L9 7 M19.5 29 L15 7"/>
        <path d="M6.2 22 L17.8 22 M7.6 16 L16.4 16 M8.7 11 L15.3 11"/>
        <path d="M6.2 22 L16.4 16 M17.8 22 L7.6 16 M7.6 16 L15.3 11 M16.4 16 L8.7 11"/>
        <path d="M12 7 L12 2"/>
        <path d="M8 5.4 L16 5.4"/>
      </g>
      <g fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4.5 29 L9 7 M19.5 29 L15 7"/>
        <path d="M6.2 22 L17.8 22 M7.6 16 L16.4 16 M8.7 11 L15.3 11"/>
      </g>
      <g fill="none" stroke="${color}" stroke-width="1" stroke-opacity="0.65" stroke-linecap="round">
        <path d="M6.2 22 L16.4 16 M17.8 22 L7.6 16 M7.6 16 L15.3 11 M16.4 16 L8.7 11"/>
      </g>
      <path d="M12 7 L12 2.5" stroke="${color}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M8.2 5.4 L15.8 5.4" stroke="${color}" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="12" cy="2" r="1.9" fill="${color}" stroke="#FFFFFF" stroke-width="1"/>
    </svg>
  `;

export const createTowerMarkerIcon = (
  state: TowerMarkerState = 'default',
  size: number = 30
): L.DivIcon => {
  const cacheKey = `${state}:${size}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const color = TOWER_ICON_COLORS[state];
  const isEmphasised = state === 'selected' || state === 'measurement';
  // Selection is carried by SIZE as well as colour. A colour-only selection
  // indicator is unusable for a colour-blind operator and fails SC 1.4.1.
  const scale = isEmphasised ? 1.3 : 1;

  const h = Math.round(size * scale);
  const w = Math.round(h * 0.78);

  const icon = towerMastSvg(color, w, h);

  const iconHtml = `
    <div style="
      width: ${w}px;
      height: ${h}px;
      line-height: 0;
      ${isEmphasised ? 'filter: drop-shadow(0 0 3px rgb(170 132 0 / 0.55));' : ''}
    ">${icon}</div>
  `;

  const divIcon = L.divIcon({
    className: `custom-tower-marker custom-tower-marker-${state}`,
    html: iconHtml,
    iconSize: [w, h],
    // Anchored at the FOOT: the coordinate is where the tower stands.
    iconAnchor: [Math.round(w / 2), h - 2],
    popupAnchor: [0, -(h - 4)],
  });

  iconCache.set(cacheKey, divIcon);
  return divIcon;
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

