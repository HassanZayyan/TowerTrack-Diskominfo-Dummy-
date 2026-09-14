import React, { useEffect, useMemo, useState } from 'react';
import {
    loadBoundary,
    boundaryToSvgPath,
    fitToViewBox,
    inBoundary,
    type Boundary,
    type TowerPoint,
} from '@/lib/geo';
import { useMotionPrefs } from '@/lib/motion';
import { cn } from '@/lib/utils';

const VIEW_W = 800;
const PAD = 28;

/**
 * The drawing decides the box, not the other way round.
 *
 * The viewBox used to be a fixed 8:5. The content — the regency plus the
 * handful of towers outside it — is close to square, so a third of the frame
 * was permanently empty and the map drifted into one corner. Deriving the
 * height from the content's own aspect removes that dead space entirely, and
 * the wrapper takes the same ratio through `aspectRatio` so the element never
 * letterboxes either.
 */

/**
 * The hero visual: Kabupaten Semarang as a field of dots, with the real towers
 * standing on it and arcs running between the tallest of them.
 *
 * WHERE THE IDIOM COMES FROM.
 *
 * Aceternity/21st.dev's `World Map` — a dotted map with animated arcs, built on
 * Motion and no WebGL. The device is a good fit here for a reason beyond
 * fashion: the dot lattice is the same `radial-gradient` dot field that
 * `HeroSection.tsx` already draws, and that pattern was itself read out of the
 * regency's own PPID stylesheet. The hero and the rest of the site end up
 * speaking the same visual language rather than the landing page arriving as a
 * guest.
 *
 * WHAT IS ADAPTED, AND WHY NOT THE PACKAGE.
 *
 * The original renders the world through the `dotted-map` npm package. That
 * package only knows how to draw the world — there is no regency in it — so
 * pulling it in would add a dependency that cannot draw the one shape this page
 * exists to show. The lattice here is an SVG `<pattern>` clipped by the real
 * OSM boundary instead, which is both smaller and correct.
 *
 * It is also two DOM nodes rather than roughly a thousand. Masking a tiled
 * pattern with one path costs the same whether the lattice is coarse or fine;
 * emitting a `<circle>` per dot would put ~1,100 elements on the page, which is
 * exactly the kind of thing that turns a mid-range Android's first paint into a
 * slideshow.
 *
 * WHAT THE PICTURE MEANS.
 *
 * Nothing here is decoration with data sprinkled on top:
 *   - a dot's POSITION is the tower's real coordinate
 *   - a dot's SIZE is its real height
 *   - a dot's COLOUR is its operator
 *   - the ARCS join the tallest tower to the tallest tower in each quadrant,
 *     which is as close as a still picture gets to saying "these carry the
 *     region's backhaul"
 */

interface HeroDotMapProps {
    points: TowerPoint[];
    owners: string[];
    className?: string;
}

/** Mirrors --data-1..5 in app.css. Index 5 is the "Lainnya" bucket. */
const OWNER_FILL = [
    'hsl(var(--data-1))',
    'hsl(var(--data-2))',
    'hsl(var(--data-3))',
    'hsl(var(--data-4))',
    'hsl(var(--data-5))',
    'hsl(var(--ink-400))',
];

/** Height in metres to dot radius in viewBox units. Sub-linear so a 120m mast does not become a blob. */
function radiusFor(height: number): number {
    if (height <= 0) return 2.1;
    return 2.1 + Math.min(Math.sqrt(height) * 0.42, 4.6);
}

/**
 * A quadratic arc that bows away from the map.
 *
 * The control point is lifted above the midpoint by a fraction of the span, so
 * short hops stay flat and long ones sweep — the same trick the original uses
 * to keep a dense map from turning into a bowl of spaghetti.
 */
function arcPath(a: [number, number], b: [number, number]): string {
    const midX = (a[0] + b[0]) / 2;
    const midY = (a[1] + b[1]) / 2;
    const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const lift = Math.min(span * 0.38, 120);
    return `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${midX.toFixed(1)} ${(midY - lift).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
}

const HeroDotMap: React.FC<HeroDotMapProps> = ({ points, owners, className }) => {
    const [boundary, setBoundary] = useState<Boundary | null>(null);
    const [failed, setFailed] = useState(false);
    const { reduce } = useMotionPrefs();

    useEffect(() => {
        let alive = true;
        loadBoundary().then(
            (b) => alive && setBoundary(b),
            () => alive && setFailed(true),
        );
        return () => {
            alive = false;
        };
    }, []);

    const geometry = useMemo(() => {
        if (!boundary) return null;

        // Only towers INSIDE the regency are drawn. A handful stand outside it
        // — around Gunungpati and Sekaran, which are Kota Semarang, and one west
        // of Bandarjo — and on a hero they read as stray marks floating beside
        // the shape rather than as information. /data-tower still shows every
        // one of them on the real map, which is where a reader goes to ask
        // where a specific tower is.
        //
        // Fitting the regency alone also gives the drawing the whole frame back:
        // including the western outlier stretched the fitted area 30% wider than
        // the regency and shrank the subject to match.
        const visible = points.filter(([lat, lng]) => inBoundary(boundary, lng, lat));

        const [west, south, east, north] = boundary.bbox;
        const aspect = (east - west) / (north - south);
        const viewH = Math.round((VIEW_W - PAD * 2) / aspect) + PAD * 2;

        // Fit the regency AND the towers. Fitting the boundary alone sliced
        // the five masts that stand outside it against the viewBox edge.
        const fit = fitToViewBox(boundary, VIEW_W, viewH, PAD);
        const [glowX, glowY] = fit.project((west + east) / 2, (south + north) / 2);
        const plotted = visible.map(([lat, lng, height, owner]) => {
            const [x, y] = fit.project(lng, lat);
            return { x, y, height, owner };
        });

        // Hub and spokes, chosen from the data: the tallest tower overall, then
        // the tallest in each quadrant around it. Deterministic, so the picture
        // is the same on every load and can be reasoned about.
        const hub = plotted.reduce((a, b) => (b.height > a.height ? b : a), plotted[0]);
        const spokes = [0, 1, 2, 3]
            .map((q) => {
                const inQuadrant = plotted.filter(
                    (p) =>
                        p !== hub &&
                        (p.x >= hub.x) === (q % 2 === 0) &&
                        (p.y >= hub.y) === (q < 2),
                );
                if (!inQuadrant.length) return null;
                return inQuadrant.reduce((a, b) => (b.height > a.height ? b : a));
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

        return {
            path: boundaryToSvgPath(boundary, fit),
            plotted,
            hub,
            spokes,
            viewH,
            aspect,
            glowX,
            glowY,
            drawn: plotted.length,
        };
    }, [boundary, points]);

    return (
        <div
            className={cn('relative w-full', className)}
            style={geometry ? { aspectRatio: String(geometry.aspect) } : undefined}
        >
            <svg
                viewBox={`0 0 ${VIEW_W} ${geometry ? geometry.viewH : 700}`}
                className="h-full w-full"
                role="img"
                aria-label={
                    `Peta sebaran menara telekomunikasi di Kabupaten Semarang${geometry ? `, ${geometry.drawn} menara` : ''}. ` +
                    'Ukuran titik mengikuti tinggi menara, warnanya mengikuti operator.'
                }
            >
                <defs>
                    {/* The PPID dot device, as a tile rather than 1,100 elements. */}
                    <pattern id="tt-hero-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="5" cy="5" r="1.15" fill="hsl(var(--border-strong))" />
                    </pattern>

                    <linearGradient id="tt-hero-arc" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        <stop offset="22%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
                        <stop offset="78%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>

                    <radialGradient id="tt-hero-glow">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.14" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {geometry && (
                    <>
                        {/* Warms the centre of the shape so the dot field does not read as a flat screen. */}
                        <ellipse
                            cx={geometry.glowX}
                            cy={geometry.glowY}
                            rx={VIEW_W * 0.46}
                            ry={geometry.viewH * 0.46}
                            fill="url(#tt-hero-glow)"
                        />

                        {/* The regency, dotted. evenodd is what keeps the Kota
                            Salatiga enclave an actual hole rather than a filled
                            island that silently annexes a neighbouring city. */}
                        <path
                            className="tt-fade-in"
                            style={{ '--tt-delay': '50ms' } as React.CSSProperties}
                            d={geometry.path}
                            fillRule="evenodd"
                            fill="url(#tt-hero-dots)"
                        />

                        {/* Outline, drawn on. `pathLength` is normalised to 1 by
                            Motion, so the dash animation is resolution-independent. */}
                        <path
                            className="tt-draw-in"
                            style={{ '--tt-duration': '1500ms' } as React.CSSProperties}
                            pathLength={1}
                            d={geometry.path}
                            fillRule="evenodd"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeOpacity={0.35}
                            strokeWidth={1.4}
                        />

                        {/* Backhaul arcs. */}
                        {geometry.spokes.map((spoke, i) => (
                            <path
                                key={`arc-${i}`}
                                className="tt-draw-in"
                                style={
                                    {
                                        '--tt-duration': '1100ms',
                                        '--tt-delay': `${550 + i * 160}ms`,
                                    } as React.CSSProperties
                                }
                                pathLength={1}
                                d={arcPath([geometry.hub.x, geometry.hub.y], [spoke.x, spoke.y])}
                                fill="none"
                                stroke="url(#tt-hero-arc)"
                                strokeWidth={1.6}
                                strokeLinecap="round"
                            />
                        ))}

                        {/* Every tower. Position, size and colour are all data. */}
                        {geometry.plotted.map((p, i) => (
                            <circle
                                key={`t-${i}`}
                                className="tt-dot-in"
                                cx={p.x}
                                cy={p.y}
                                r={radiusFor(p.height)}
                                fill={OWNER_FILL[p.owner] ?? OWNER_FILL[5]}
                                fillOpacity={0.9}
                                style={
                                    {
                                        // Spread by POSITION, not array index, so the
                                        // field fills in as a sweep west to east rather
                                        // than in whatever order the database returned.
                                        '--tt-delay': `${Math.round(350 + (p.x / VIEW_W) * 700)}ms`,
                                    } as React.CSSProperties
                                }
                            />
                        ))}

                        {/* The endpoints of the arcs get a ring, so the eye has
                            somewhere to land once the arcs finish drawing. */}
                        {[geometry.hub, ...geometry.spokes].map((p, i) => (
                            <circle
                                key={`pulse-${i}`}
                                cx={p.x}
                                cy={p.y}
                                r={radiusFor(p.height) + 2}
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth={1.2}
                                strokeOpacity={0.55}
                            >
                                {/* SMIL rather than Motion: this is an idle
                                    ambient loop, and keeping it off the main
                                    thread's animation loop means it costs nothing
                                    while the rest of the page is interacting.
                                    Suppressed entirely under reduced motion —
                                    a slower pulse is still a pulse. */}
                                {!reduce && (
                                    <>
                                        <animate
                                            attributeName="r"
                                            values={`${radiusFor(p.height) + 2};${radiusFor(p.height) + 9};${radiusFor(p.height) + 2}`}
                                            dur="2.8s"
                                            begin={`${1.2 + i * 0.35}s`}
                                            repeatCount="indefinite"
                                        />
                                        <animate
                                            attributeName="stroke-opacity"
                                            values="0.55;0;0.55"
                                            dur="2.8s"
                                            begin={`${1.2 + i * 0.35}s`}
                                            repeatCount="indefinite"
                                        />
                                    </>
                                )}
                            </circle>
                        ))}
                    </>
                )}
            </svg>

            {/* Legend. The colours are only information if they are named. */}
            {geometry && owners.length > 0 && (
                <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2">
                    {owners.map((name, i) => (
                        <li key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                                aria-hidden="true"
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ background: OWNER_FILL[i] ?? OWNER_FILL[5] }}
                            />
                            {name}
                        </li>
                    ))}
                </ul>
            )}

            {/* Never a spinner. If the boundary cannot be fetched the hero copy
                and its actions are already on screen and fully usable; the map
                is the one part that is allowed to be missing. */}
            {failed && (
                <p className="absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground">
                    Peta sebaran tidak dapat dimuat.
                </p>
            )}
        </div>
    );
};

export default HeroDotMap;
