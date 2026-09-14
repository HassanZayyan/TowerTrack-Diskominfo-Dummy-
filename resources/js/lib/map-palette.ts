/**
 * The single source of truth for every Leaflet colour.
 *
 * Mirrors the --data-* and --map-* custom properties in resources/css/app.css.
 * Leaflet cannot read CSS custom properties out of a JS options object, so
 * these have to be literals — but they are literals in ONE file rather than
 * scattered across 353 sites.
 *
 * The governing principle: BLUE IS THE APPLICATION, EVERYTHING ELSE IS DATA.
 * Nothing on the map may wear the brand hue, because a marker in brand blue is
 * indistinguishable from chrome. That is exactly the bug this file fixes —
 * utils/towerIconUtils.ts currently paints the DEFAULT tower marker #2563EB,
 * which is brand-600.
 *
 * STATUS: not yet wired up. Phase 5 rewires towerIconUtils.ts, foIconUtils.ts
 * and LeafletMap.tsx to import from here. Until then this file is inert.
 */

/**
 * Categorical series for FO route polylines.
 *
 * HARD CAP OF 5. Verified worst-case pairwise OKLab dE across normal vision,
 * deuteranopia and protanopia is 17.0. A sixth hue cannot be added without
 * dropping below the distinctness floor — category 6 and beyond are carried by
 * DASH PATTERN instead, giving 5 colours x 4 dashes = 20 distinct identities.
 *
 * None of these is blue: they have to stay legible against OSM tiles AND stay
 * clear of the application's own chrome.
 */
export const FO_ROUTE_COLORS = ['#982700', '#00888E', '#6B005C', '#5F9D00', '#C06DFF'] as const;

/** Second channel for route identity, so colour is never load-bearing alone. */
export const FO_ROUTE_DASHES = [undefined, '8 4', '2 6', '12 4 2 4'] as const;

/**
 * What a route is drawn in when it has no colour of its own.
 *
 * Every fallback and form default in the FO screens was `#3B82F6` — stock
 * Tailwind blue, and the ONE hue the note at the top of this file rules out for
 * the map, because a blue line on an OSM basemap competes with the water and
 * with the application's own chrome. It appeared in seven places, including the
 * `color` column default, so a route created without a colour was guaranteed to
 * come out in it.
 *
 * FO_ROUTE_COLORS[0] instead: the first entry of the categorical series that
 * was actually calibrated for this job.
 */
export const FO_ROUTE_FALLBACK: string = FO_ROUTE_COLORS[0];

/** Drawn beneath every polyline at weight + 4. This is what makes routes pop off OSM tiles. */
export const ROUTE_CASING = '#FFFFFF';

/**
 * The coverage disc around a tower on /data-tower.
 *
 * Was `#2563eb` stroke over a `#3b82f6` fill — stock Tailwind blue, left from
 * before the token migration and the only blue left anywhere on the map. It
 * read as a different product's layer sitting on top of this one.
 *
 * Brand maroon instead, and that is a deliberate exception to the rule at the
 * top of this file. "Nothing on the map may wear the brand hue" is about
 * MARKERS: a brand-coloured pin cannot be told apart from chrome. A coverage
 * disc is not a marker. It is this application's own derived overlay — height
 * times eight — laid over the base map, and the brand is exactly the right
 * thing to say that with. It is also unmistakable against the ink-700 pins it
 * surrounds and against every --data hue.
 */
export const COVERAGE = {
    stroke: '#800000',
    fill: '#800000',
    /** Low, because these discs overlap heavily in Ungaran and compound. */
    fillOpacity: 0.08,
    strokeOpacity: 0.45,
} as const;

export const TOWER_ICON_COLORS = {
    /** ink-700. Towers are DATA, not chrome — this replaces the old #2563EB.
     *  Was written as #334155, which is stock Tailwind slate-700: a COOL grey in
     *  a palette whose entire neutral ramp is warm stone. */
    default: '#44403C',
    /** Dark Sun Gold. dE 35.8 from brand, 28.5 from the default pin.
     *  MUST be paired with 1.25x scale and a 3px white ring: colour alone is
     *  not an accessible selection indicator. */
    selected: '#AA8400',
    active: '#047857',
    /** Requires a 1px #92400E outline — amber is 2.15:1 on white and fails
     *  SC 1.4.11 as a bare graphical object. */
    maintenance: '#F59E0B',
    inactive: '#DC2626',
    /** ink-900, dashed. Measurement is a tool, not an error — it should not be red. */
    measurement: '#0F172A',
    unknown: '#7E8EA6',
} as const;

/**
 * Side-of-road encoding.
 *
 * TWO NEUTRALS, NOT ONE — AND THEY DIFFER BY LIGHTNESS, NOT HUE.
 *
 * This used to be a single colour for both sides, on the reasoning that the L
 * and R glyphs already carried the meaning. At 6px in the corner of a 24px disc
 * they do not: on a map showing two hundred points in dense chains, two badges
 * that differ only by one letterform are two badges nobody reads. The corner
 * they sit in is the only thing that separated them, and a reader has to know
 * that rule before it helps.
 *
 * So the pair is now black-on-white against white-on-black — the largest
 * difference two marks can have. Deliberately NOT two hues: hue is already
 * fully committed to the eight point categories below, and a ninth and tenth
 * colour would collide with them. Lightness is a free axis here, and unlike hue
 * it survives every form of colour blindness intact.
 *
 * Both are off the ink ramp, so nothing new enters the palette. `ring` is what
 * keeps each badge off whatever it lands on: the dark badge is ringed in white,
 * the pale one in ink, and neither can dissolve into a map tile.
 */
export const SIDE_OF_ROAD_STYLES = {
    /** ink-700 on white — the dark half of the pair. */
    left: { fill: '#44403C', ink: '#FFFFFF', ring: '#FFFFFF' },
    /** ink-50 with ink-900 text — the light half. */
    right: { fill: '#FAFAF9', ink: '#1C1917', ring: '#44403C' },
    /** ink-300. Pale and unsaturated, because this is an absence, not a side. */
    unknown: { fill: '#D6D3D1', ink: '#1C1917', ring: '#78716C' },
} as const;

/** Deterministic style for a route that has no explicit colour of its own. */
export function routeStyle(index: number) {
    return {
        color: FO_ROUTE_COLORS[index % FO_ROUTE_COLORS.length],
        dashArray:
            FO_ROUTE_DASHES[Math.floor(index / FO_ROUTE_COLORS.length) % FO_ROUTE_DASHES.length],
    };
}

/**
 * FO point categories.
 *
 * Fixes a live bug: utils/foIconUtils.ts assigned #F59E0B to BOTH 'JB' and 'J',
 * so two different point categories rendered identically on the map. The code
 * comments show the divergence was intended ("// Orange" at one site, "// Amber"
 * at the other) but the hex was never actually differentiated.
 *
 * WHY THESE ARE NOT THE --data-1..5 TOKENS ANY MORE.
 *
 * They used to be, and it made the markers unreadable in two opposite
 * directions at once. Every one of these is drawn as a ~20px disc with its code
 * in bold white, and against white text the old set ran from 11.80:1 (PIJ, a
 * plum so deep it read as black) down to 3.06:1 (IJ, an orchid the letters
 * disappeared into). Half the markers looked like ink blots and the other half
 * could not be read at all.
 *
 * Each one is now tuned to put white text at ~5.2:1 — comfortably past the 4.5
 * floor, and even across the whole set, so no marker is visually heavier than
 * its neighbour. Hue and saturation are carried over from the old values, so
 * the categories keep the identities people already know them by.
 *
 * `--data-1..5` are untouched and still carry FO ROUTE identity, where the
 * deuteranopia/protanopia work that calibrated them still applies. The two
 * encodings are separate on purpose: a colour meaning "plum route" and "plum
 * point type" at the same time is worse than two palettes.
 *
 * `P` and `unknown` are warm neutrals off the ink ramp rather than the old
 * `#334155` and `#7E8EA6`, which were stock Tailwind slate — cool greys that
 * did not belong to this palette, and close enough to OSM's water to be
 * confusing.
 *
 * Colour is the SECOND channel here regardless. Every marker carries its code
 * (PIJ, PI, JB, P, I, J, IJ, ?) in the middle, so a reader who cannot separate
 * two hues still reads the letters.
 */
/**
 * WHY THIS SET WAS RECALCULATED AGAIN.
 *
 * The previous set was tuned so that every marker put white text at about the
 * same 5.2:1 — even visual weight across the eight. Even weight turned out to
 * cost the thing that actually matters, which is telling them apart. Holding
 * lightness constant leaves hue as the only axis, and hue alone cannot carry
 * eight categories once blue is ruled out. Measured worst-case OKLab distance
 * across the old set:
 *
 *     normal vision   dE  2.8   P vs unknown  — two greys, all but identical
 *     deuteranopia    dE  1.8   PI vs P
 *     protanopia      dE  2.4   I vs unknown
 *
 * dE 2.8 is not a distinction. `P` (#716C66) and `unknown` (#797470) were the
 * same grey to any reader, which meant "a pole" and "no photograph at all" —
 * a fact and the absence of one — rendered as the same marker.
 *
 * LIGHTNESS IS NOW THE SECOND AXIS. Six hues at 50-80 degrees apart, and each
 * one's lightness chosen so that neighbours on the wheel are also a light/dark
 * pair. Which hue gets which lightness is not a guess: all 64 assignments were
 * generated and scored on worst-case pairwise distance under normal vision,
 * deuteranopia and protanopia, and this is the winner.
 *
 *     normal vision   dE 12.9   P vs PI      (was 2.8)
 *     deuteranopia    dE  7.0   JB vs PI     (was 1.8)
 *     protanopia      dE  7.2   P vs JB      (was 2.4)
 *
 * Text contrast is still checked, just no longer pinned to one value: every
 * fill clears 4.7:1 against its own `ink`, so the code in the middle stays
 * readable on all eight.
 *
 * `unknown` is the one that breaks the pattern on purpose. It is pale with DARK
 * text while every category is saturated with light text, so "no data" does not
 * look like a category — it looks like a blank. `P` keeps the neutral because a
 * plain pole is the plain case; it is now ink-700, far enough from pale
 * `unknown` that the two can never be read as each other again.
 *
 * Colour remains the SECOND channel regardless: every marker carries its code
 * (PIJ, PI, JB, P, I, J, IJ, ?), so a reader who separates no hues at all still
 * reads the letters.
 */
export const FO_POINT_STYLES = {
    /** rose 330, light */
    PIJ: { fill: '#E20071', ink: '#FFFFFF' },
    /** green 150, dark */
    PI: { fill: '#006332', ink: '#FFFFFF' },
    /** red-brown 14, dark */
    JB: { fill: '#A32600', ink: '#FFFFFF' },
    /** ink-700 — the plain case keeps the neutral */
    P: { fill: '#44403C', ink: '#FFFFFF' },
    /** teal 196, light */
    I: { fill: '#007CA9', ink: '#FFFFFF' },
    /** olive 68, light */
    J: { fill: '#6B7B00', ink: '#FFFFFF' },
    /** violet 272, light */
    IJ: { fill: '#9E41F0', ink: '#FFFFFF' },
    /** ink-300 with dark text — an absence, drawn as one */
    unknown: { fill: '#D6D3D1', ink: '#1C1917' },
} as const;

export type FoPointCode = keyof typeof FO_POINT_STYLES;

/**
 * Resolve a marker's code to its fill and text colour.
 *
 * Takes the code the marker already displays ('PIJ', 'P', '?') so a caller
 * cannot pick a fill and a text colour from two different rows.
 */
export function foPointStyle(code: string): { fill: string; ink: string } {
    const key = (code === '?' ? 'unknown' : code) as FoPointCode;
    return FO_POINT_STYLES[key] ?? FO_POINT_STYLES.unknown;
}
