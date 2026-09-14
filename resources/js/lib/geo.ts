/**
 * Geometry shared by the two landing visuals.
 *
 * Both the SVG hero and the isometric canvas draw the same regency from the
 * same boundary file and the same tower points, so the projection, the bounds
 * and the point-in-polygon test live here rather than being written twice and
 * drifting apart.
 *
 * THE BOUNDARY FILE.
 *
 * `public/geo/kab-semarang.json` is OpenStreetMap relation 9686813, simplified
 * with Douglas-Peucker to 1,659 points at four decimal places: 31KB raw, under
 * 8KB gzipped. It is FETCHED, not imported — bundling it would put 31KB of
 * coordinates through the JS parser on a page that may never scroll far enough
 * to draw them.
 *
 * It is a real MultiPolygon with a real hole. Kota Salatiga is a separate
 * administrative city entirely surrounded by Kabupaten Semarang, so the
 * regency is a ring, not a blob. Anything that fills or hits-tests this shape
 * has to respect the hole or Salatiga silently becomes part of the regency.
 */

export type Ring = [number, number][];
/** GeoJSON polygon: ring 0 is the outer boundary, the rest are holes. */
export type Polygon = Ring[];

export interface Boundary {
    polygons: Polygon[];
    /** [west, south, east, north] */
    bbox: [number, number, number, number];
}

/** [latitude, longitude, height in metres, owner index] — the wire format from LandingController. */
export type TowerPoint = [number, number, number, number];

let cache: Promise<Boundary> | null = null;

/**
 * Load and cache the regency boundary.
 *
 * Cached at module scope so the hero and the isometric section share one
 * request even though they mount at different times.
 */
export function loadBoundary(): Promise<Boundary> {
    if (!cache) {
        cache = fetch('/geo/kab-semarang.json')
            .then((r) => {
                if (!r.ok) throw new Error(`boundary ${r.status}`);
                return r.json();
            })
            .then((json) => ({
                polygons: json.coordinates as Polygon[],
                bbox: json.bbox as [number, number, number, number],
            }))
            .catch((err) => {
                // Let a later mount retry rather than caching the failure
                // forever: a dropped request on a train should not
                // permanently blank the map for the rest of the session.
                cache = null;
                throw err;
            });
    }
    return cache;
}

/**
 * A flat local coordinate frame, in kilometres, centred on the region.
 *
 * Equirectangular, which is the right call at this scale and the wrong one at
 * any larger: across a regency 45km wide the error against a proper projection
 * is centimetres, and in exchange every transform stays two multiplications
 * instead of a trigonometric round trip per point per frame.
 *
 * Longitude is scaled by cos(latitude) so the shape is not stretched
 * east-west. Y is negated so that north is up, which is what every reader
 * expects and what neither screen coordinates nor latitude give you.
 */
export interface Frame {
    cx: number;
    cy: number;
    kxPerDeg: number;
    kyPerDeg: number;
    widthKm: number;
    heightKm: number;
}

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LNG = 111.32;

export function makeFrame(bbox: [number, number, number, number]): Frame {
    const [west, south, east, north] = bbox;
    const cx = (west + east) / 2;
    const cy = (south + north) / 2;
    const kxPerDeg = KM_PER_DEG_LNG * Math.cos((cy * Math.PI) / 180);

    return {
        cx,
        cy,
        kxPerDeg,
        kyPerDeg: KM_PER_DEG_LAT,
        widthKm: (east - west) * kxPerDeg,
        heightKm: (north - south) * KM_PER_DEG_LAT,
    };
}

/** Longitude/latitude to kilometres east/north of the frame centre. */
export function toLocal(frame: Frame, lng: number, lat: number): [number, number] {
    return [(lng - frame.cx) * frame.kxPerDeg, (lat - frame.cy) * frame.kyPerDeg];
}

/**
 * Even-odd ray casting against one ring.
 *
 * The classic crossing-number test. Comparing `lat` against each edge's
 * endpoints with a strict inequality on one side and not the other is what
 * makes a vertex exactly on the ray count once instead of twice.
 */
function inRing(lng: number, lat: number, ring: Ring): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * True if the point is inside the regency — outside every hole, inside some
 * outer ring.
 *
 * The bounding-box test first is not decoration. `inRing` walks every edge of a
 * ring, and the outer ring alone is 1,394 of them; both landing visuals call
 * this once per tower, so a naive pass is well over three hundred thousand edge
 * tests per page. Anything outside the regency's box — which is most of what
 * gets asked about, since the box is the first thing a caller has — is rejected
 * by four comparisons instead.
 */
export function inBoundary(boundary: Boundary, lng: number, lat: number): boolean {
    const [west, south, east, north] = boundary.bbox;
    if (lng < west || lng > east || lat < south || lat > north) return false;

    for (const poly of boundary.polygons) {
        if (!inRing(lng, lat, poly[0])) continue;
        for (let h = 1; h < poly.length; h++) {
            if (inRing(lng, lat, poly[h])) return false;
        }
        return true;
    }
    return false;
}

/**
 * The coverage radius a tower of this height is drawn with, in metres.
 *
 * Not a new formula: this is the one /data-tower already draws its coverage
 * circles with, lifted so the landing page cannot quietly disagree with the
 * map a reader reaches by clicking through from it.
 *
 * It is a rule of thumb, not propagation modelling — height times eight,
 * floored at 100m and capped at 3km.
 */
export function coverageRadiusMetres(heightMetres: number): number {
    if (!heightMetres || heightMetres <= 0) return 0;
    return Math.min(Math.max(heightMetres * 8, 100), 3000);
}

/**
 * Bounds that contain the regency AND every tower, in local kilometres.
 *
 * Towers are not clipped to the boundary. Some sit just outside it — near
 * Gunungpati, which is Kota Semarang — and hiding them would be editing the
 * data to flatter the drawing. The camera widens instead.
 */
export function contentBounds(
    frame: Frame,
    boundary: Boundary,
    points: TowerPoint[],
): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const include = (x: number, y: number) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    };

    for (const poly of boundary.polygons) {
        for (const [lng, lat] of poly[0]) {
            const [x, y] = toLocal(frame, lng, lat);
            include(x, y);
        }
    }
    for (const [lat, lng] of points) {
        const [x, y] = toLocal(frame, lng, lat);
        include(x, y);
    }

    return { minX, maxX, minY, maxY };
}

/**
 * Fit a lng/lat area into a 0..width / 0..height viewBox.
 *
 * ONE function, used by both the outline path and the tower projector.
 *
 * They used to carry a copy of this arithmetic each, which is how they came to
 * disagree: both fitted the BOUNDARY bbox alone, so the four towers that stand
 * outside the regency — three around Gunungpati and Sekaran, which are Kota
 * Semarang, and one west of Bandarjo — projected to coordinates outside the
 * viewBox and were sliced in half by its edge. On screen that read as a broken
 * drawing rather than as data.
 *
 * `extraPoints` widens the fitted area to include anything that has to be
 * drawn. The regency ends up a little smaller, which is the correct trade: a
 * viewport must contain everything it renders, and a dot sitting OUTSIDE the
 * outline is true and meaningful — that tower really is outside the regency.
 */
export interface SvgFit {
    project: (lng: number, lat: number) => [number, number];
    scale: number;
}

export function fitToViewBox(
    boundary: Boundary,
    width: number,
    height: number,
    padding = 0,
    extraPoints: TowerPoint[] = [],
): SvgFit {
    let [west, south, east, north] = boundary.bbox;

    for (const [lat, lng] of extraPoints) {
        if (lng < west) west = lng;
        if (lng > east) east = lng;
        if (lat < south) south = lat;
        if (lat > north) north = lat;
    }

    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    // Preserve aspect: fit the tighter axis, centre along the other.
    const scale = Math.min(innerW / (east - west), innerH / (north - south));
    const offsetX = padding + (innerW - (east - west) * scale) / 2;
    const offsetY = padding + (innerH - (north - south) * scale) / 2;

    return {
        scale,
        project: (lng, lat) => [offsetX + (lng - west) * scale, offsetY + (north - lat) * scale],
    };
}

/**
 * SVG path data for every ring, in the coordinate space of a given fit.
 *
 * One `<path>` with a subpath per ring, so the outer boundary and the Salatiga
 * hole are a single fillable shape under the even-odd rule rather than two
 * elements that have to be composited.
 */
export function boundaryToSvgPath(boundary: Boundary, fit: SvgFit): string {
    let d = '';
    for (const poly of boundary.polygons) {
        for (const ring of poly) {
            const [x0, y0] = fit.project(ring[0][0], ring[0][1]);
            d += `M${x0.toFixed(1)} ${y0.toFixed(1)}`;
            for (let i = 1; i < ring.length; i++) {
                const [x, y] = fit.project(ring[i][0], ring[i][1]);
                d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
            }
            d += 'Z';
        }
    }
    return d;
}
