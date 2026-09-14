import React from 'react';
import { cn } from '@/lib/utils';

/**
 * The illustration in the right-hand column of the two public data heroes.
 *
 * WHY IT REPLACED THE STOCK ART.
 *
 * /data-tower and /data-fo each carried a cartoon PNG — 773KB and 1.3MB before
 * they were converted, 100KB and 120KB after. Two problems survived the
 * conversion. They are drawn in a palette that has nothing to do with this
 * application (sunset orange, meadow green), so the one area of the hero with
 * any colour in it fights the maroon everything else uses. And they say nothing:
 * a generic tower scene is wallpaper, and the page below it is about real
 * infrastructure in one specific regency.
 *
 * This is drawn instead, in the same isometric idiom as the landing page's
 * distribution map, out of the same tokens as every other surface. It costs
 * about 4KB of markup against 220KB of photograph, scales to any density, and
 * follows the palette automatically if the palette ever moves.
 *
 * WHY NOT A DOWNLOADED 3D MODEL.
 *
 * §4.1 of the redesign plan rules out `.glb`/`.gltf`/`.fbx` entirely, and the
 * reasoning holds here: a model needs a renderer, a renderer needs WebGL, and
 * the target device is a mid-range Android at the mercy of whatever GL driver
 * the vendor shipped. An isometric projection in flat SVG gives the same sense
 * of depth for no runtime at all.
 *
 * WHY NOT THE REGENCY CREST.
 *
 * It already appears twice on every page, in the app bar and in the footer. A
 * third copy blown up to hero size would be the largest thing on the screen and
 * still not tell the reader anything about towers or fibre.
 *
 * THE ANIMATION IS CSS, NOT MOTION.
 *
 * `tt-draw-in` and `tt-fade-in` run on mount without an animation frame, so the
 * drawing is complete in a crawler, a headless capture or a background tab.
 * See the note in app.css; this codebase has been bitten three times by
 * content that depended on rAF to become visible.
 */

type Variant = 'tower' | 'fiber';

interface HeroIsoArtProps {
    variant: Variant;
    className?: string;
}

const W = 420;
const H = 360;

/** Ground-plane origin. Everything is positioned relative to this. */
const OX = W / 2;
const OY = 226;

/**
 * Half-extent of the ground plane, in world units.
 *
 * Sized so the diamond fits the frame rather than being sliced by it. A square
 * of half-extent G projects to a diamond 2 * G * 0.866 wide and 2 * G * 0.5
 * tall, so the binding constraints are `G * 1.732 <= W / 2` and
 * `OY + G <= H`. At 112 both hold with a margin to spare; the first version
 * used 150 and lost all four corners off the edges of the viewBox.
 */
const GROUND = 112;

/**
 * World (x, y, z) to screen, in a true 2:1 isometric.
 *
 * x runs to the lower right, y to the lower left, z straight up. The 0.5
 * vertical factor against 0.866 horizontal is what gives the familiar
 * 30-degree tile; anything steeper starts reading as a perspective drawing and
 * invites the reader to look for a vanishing point that is not there.
 */
function iso(x: number, y: number, z: number): [number, number] {
    return [OX + (x - y) * 0.866, OY + (x + y) * 0.5 - z];
}

const p = (pt: [number, number]) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;

/** A ring on the ground plane: a circle seen at the isometric angle is an ellipse. */
function GroundRing({ r, opacity }: { r: number; opacity: number }) {
    return (
        <ellipse
            cx={OX}
            cy={OY}
            rx={r * 0.866 * Math.SQRT2}
            ry={r * 0.5 * Math.SQRT2}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeOpacity={opacity}
            strokeWidth={1}
        />
    );
}

/**
 * A lattice mast.
 *
 * Four legs tapering from `base` to `top` half-width, braced by an X on each
 * bay. Real towers are braced this way, and drawing the bracing rather than a
 * solid silhouette is what makes it read as a structure rather than a pylon
 * icon.
 */
function Mast({
    x,
    y,
    height,
    base,
    top,
    bays,
}: {
    x: number;
    y: number;
    height: number;
    base: number;
    top: number;
    bays: number;
}) {
    const corners: [number, number][] = [
        [1, 1],
        [1, -1],
        [-1, -1],
        [-1, 1],
    ];
    const halfAt = (t: number) => base + (top - base) * t;
    const legs: string[] = [];
    const braces: string[] = [];
    const rings: string[] = [];

    for (let b = 0; b <= bays; b++) {
        const t = b / bays;
        const z = height * t;
        const h = halfAt(t);
        const ringPts = corners.map(([cx, cy]) => p(iso(x + cx * h, y + cy * h, z)));
        rings.push(`M${ringPts.join('L')}Z`);
    }

    for (const [cx, cy] of corners) {
        const a = iso(x + cx * base, y + cy * base, 0);
        const bTop = iso(x + cx * top, y + cy * top, height);
        legs.push(`M${p(a)}L${p(bTop)}`);
    }

    // One X per bay on the two faces the viewer can actually see.
    for (let b = 0; b < bays; b++) {
        const t0 = b / bays;
        const t1 = (b + 1) / bays;
        const h0 = halfAt(t0);
        const h1 = halfAt(t1);
        const z0 = height * t0;
        const z1 = height * t1;
        const faces: Array<[[number, number], [number, number]]> = [
            [
                [1, 1],
                [1, -1],
            ],
            [
                [1, -1],
                [-1, -1],
            ],
        ];
        for (const [c0, c1] of faces) {
            braces.push(
                `M${p(iso(x + c0[0] * h0, y + c0[1] * h0, z0))}L${p(iso(x + c1[0] * h1, y + c1[1] * h1, z1))}`,
            );
            braces.push(
                `M${p(iso(x + c1[0] * h0, y + c1[1] * h0, z0))}L${p(iso(x + c0[0] * h1, y + c0[1] * h1, z1))}`,
            );
        }
    }

    return (
        <g>
            <path
                className="tt-draw-in"
                style={{ '--tt-duration': '900ms', '--tt-delay': '120ms' } as React.CSSProperties}
                pathLength={1}
                d={braces.join('')}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.28}
                strokeWidth={1}
                fill="none"
            />
            <path
                className="tt-draw-in"
                style={{ '--tt-duration': '1100ms' } as React.CSSProperties}
                pathLength={1}
                d={rings.join('')}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.45}
                strokeWidth={1}
                fill="none"
            />
            <path
                className="tt-draw-in"
                style={{ '--tt-duration': '1100ms' } as React.CSSProperties}
                pathLength={1}
                d={legs.join('')}
                stroke="hsl(var(--primary))"
                strokeWidth={1.8}
                strokeLinecap="round"
                fill="none"
            />
        </g>
    );
}

/** A utility pole with a crossarm, for the fibre scene. */
function Pole({ x, y, height }: { x: number; y: number; height: number }) {
    const foot = iso(x, y, 0);
    const head = iso(x, y, height);
    const armL = iso(x, y - 13, height - 10);
    const armR = iso(x, y + 13, height - 10);

    return (
        <g>
            <path
                d={`M${p(foot)}L${p(head)}`}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            <path
                d={`M${p(armL)}L${p(armR)}`}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.7}
                strokeWidth={1.6}
                strokeLinecap="round"
                fill="none"
            />
            <ellipse cx={foot[0]} cy={foot[1]} rx={5} ry={2.6} fill="hsl(var(--border-strong))" />
        </g>
    );
}

/**
 * A sagging span between two poles.
 *
 * The control point is dropped below the midpoint so the cable hangs. A
 * straight line between poles reads as a fence; the sag is the entire reason
 * the eye recognises it as cable.
 */
function span(a: [number, number], b: [number, number], sag: number) {
    return `M${p(a)}Q${((a[0] + b[0]) / 2).toFixed(1)},${((a[1] + b[1]) / 2 + sag).toFixed(1)} ${p(b)}`;
}

const HeroIsoArt: React.FC<HeroIsoArtProps> = ({ variant, className }) => {
    // Kept inside the ground diamond: at 104 the left-hand pole planted its
    // foot past the plane's upper-left edge and looked like it was standing in
    // mid-air.
    const poles = [-88, 0, 88];

    return (
        <div className={cn('relative w-full', className)}>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-full w-full"
                role="img"
                aria-label={
                    variant === 'tower'
                        ? 'Ilustrasi isometrik menara telekomunikasi dengan lingkaran jangkauan di sekelilingnya'
                        : 'Ilustrasi isometrik tiang dan kabel serat optik yang membentang'
                }
            >
                <defs>
                    {/* The same dot device the app bar's page bands and the
                        landing hero use, read out of the regency's own PPID
                        stylesheet. */}
                    <pattern id={`tt-art-dots-${variant}`} width="11" height="11" patternUnits="userSpaceOnUse">
                        <circle cx="5.5" cy="5.5" r="1" fill="hsl(var(--border-strong))" />
                    </pattern>
                    <radialGradient id={`tt-art-glow-${variant}`}>
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </radialGradient>
                </defs>

                <ellipse cx={OX} cy={OY - 20} rx={W * 0.46} ry={H * 0.38} fill={`url(#tt-art-glow-${variant})`} />

                {/* Ground plane: a diamond, which is what a square looks like
                    from this angle. Dotted so it reads as ground rather than as
                    a solid card floating in the hero. */}
                <path
                    className="tt-fade-in"
                    d={`M${p(iso(-GROUND, -GROUND, 0))}L${p(iso(GROUND, -GROUND, 0))}L${p(iso(GROUND, GROUND, 0))}L${p(iso(-GROUND, GROUND, 0))}Z`}
                    fill={`url(#tt-art-dots-${variant})`}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                />

                {variant === 'tower' ? (
                    <>
                        {/* Coverage, drawn the way /data-tower draws it: rings
                            on the ground centred on the mast. */}
                        <g
                            className="tt-fade-in"
                            style={{ '--tt-delay': '420ms' } as React.CSSProperties}
                        >
                            <GroundRing r={104} opacity={0.16} />
                            <GroundRing r={74} opacity={0.24} />
                            <GroundRing r={45} opacity={0.34} />
                        </g>

                        <Mast x={0} y={0} height={158} base={24} top={8} bays={5} />

                        {/* The headframe.

                            The first version hung three panels at 0, 120 and 240
                            degrees in world space. Those are symmetric on the
                            ground but NOT on screen: the isometric projection
                            gives each a different length and angle, so the top
                            of the mast came out lopsided and busy — exactly
                            where the eye lands first.

                            They point out of the four FACE midpoints, not the
                            four corners. A corner arm at (1,1) has x - y = 0, so
                            the projection gives it no horizontal offset at all
                            and it disappears straight down the mast's own axis;
                            two of the four vanished that way and the remaining
                            pair collapsed into a flat T-bar. Face midpoints
                            project to four distinct screen directions and read
                            as four arms in space.

                            The panels are short vertical strokes, which is what
                            a sector panel actually looks like from the side. */}
                        <g
                            className="tt-fade-in"
                            style={{ '--tt-delay': '700ms' } as React.CSSProperties}
                        >
                            {([
                                [1, 0],
                                [0, 1],
                                [-1, 0],
                                [0, -1],
                            ] as const).map(([cx, cy], i) => {
                                const armZ = 140;
                                const reach = 26;
                                const anchor = iso(cx * 9, cy * 9, armZ);
                                const tip = iso(cx * reach, cy * reach, armZ);
                                const panelTop = iso(cx * reach, cy * reach, armZ + 8);
                                const panelBottom = iso(cx * reach, cy * reach, armZ - 8);
                                return (
                                    <g key={i}>
                                        <path
                                            d={`M${p(anchor)}L${p(tip)}`}
                                            stroke="hsl(var(--primary))"
                                            strokeOpacity={0.75}
                                            strokeWidth={1.3}
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d={`M${p(panelTop)}L${p(panelBottom)}`}
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3.2}
                                            strokeLinecap="round"
                                        />
                                    </g>
                                );
                            })}

                            {/* Spire, straight up from the centre. */}
                            <path
                                d={`M${p(iso(0, 0, 158))}L${p(iso(0, 0, 182))}`}
                                stroke="hsl(var(--primary))"
                                strokeWidth={1.6}
                                strokeLinecap="round"
                            />
                            <circle cx={iso(0, 0, 186)[0]} cy={iso(0, 0, 186)[1]} r={2.8} fill="hsl(var(--primary))" />
                        </g>
                    </>
                ) : (
                    <>
                        <g
                            className="tt-fade-in"
                            style={{ '--tt-delay': '360ms' } as React.CSSProperties}
                        >
                            {poles.map((x) => (
                                <Pole key={x} x={x} y={0} height={96} />
                            ))}
                        </g>

                        {/* Cable is black. It was drawn in two --data colours,
                            borrowing the categorical palette that /data-fo uses
                            to tell one ROUTE from another — but there is only
                            one route here, so the colours encoded nothing and
                            simply added two more hues to the hero. Fibre is
                            black; drawing it black is both simpler and true. */}
                        <g
                            className="tt-draw-in"
                            style={{ '--tt-duration': '1200ms', '--tt-delay': '260ms' } as React.CSSProperties}
                        >
                            <path
                                pathLength={1}
                                d={[0, 1]
                                    .map((i) =>
                                        span(
                                            iso(poles[i], -11, 86),
                                            iso(poles[i + 1], -11, 86),
                                            13,
                                        ),
                                    )
                                    .join('')}
                                stroke="hsl(var(--ink-900))"
                                strokeWidth={1.8}
                                fill="none"
                                strokeLinecap="round"
                            />
                        </g>
                        <g
                            className="tt-draw-in"
                            style={{ '--tt-duration': '1200ms', '--tt-delay': '380ms' } as React.CSSProperties}
                        >
                            <path
                                pathLength={1}
                                d={[0, 1]
                                    .map((i) =>
                                        span(
                                            iso(poles[i], 11, 86),
                                            iso(poles[i + 1], 11, 86),
                                            17,
                                        ),
                                    )
                                    .join('')}
                                stroke="hsl(var(--ink-900))"
                                strokeWidth={1.8}
                                fill="none"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* The joint boxes that used to sit on the ground here
                            are gone. Three poles and two spans say "fibre"
                            without them, and a pair of small orange cubes on an
                            otherwise monochrome plane pulled the eye away from
                            the thing the drawing is about. */}
                    </>
                )}
            </svg>
        </div>
    );
};

export default HeroIsoArt;
