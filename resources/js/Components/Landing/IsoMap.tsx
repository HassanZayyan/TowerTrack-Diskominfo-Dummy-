import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    loadBoundary,
    makeFrame,
    toLocal,
    contentBounds,
    coverageRadiusMetres,
    inBoundary,
    type Boundary,
    type TowerPoint,
} from '@/lib/geo';
import { cn } from '@/lib/utils';

/**
 * Kabupaten Semarang as a tilted plane with its towers standing on it.
 *
 * WHY CANVAS 2D AND NOT THREE.JS.
 *
 * The look wanted here is depth, not photorealism, and an isometric projection
 * in a 2D context gives depth for about 8KB of arithmetic. three.js is 500KB+
 * before a single mesh, compiles shaders on first paint, and on the cheap
 * Android hardware this app targets is at the mercy of whatever GL driver the
 * vendor shipped. A regency outline, a few hundred vertical lines and some
 * ellipses do not need a GPU pipeline.
 *
 * WHAT THE CAMERA DOES.
 *
 * Two parameters, both supplied by the reader's drag: `yaw` in radians, free to
 * wrap, and `pitch` normalised 0 to 1 between nearly top-down and 58 degrees.
 *
 * It used to take a single `progress` driven by scroll position. That gave the
 * reader exactly one pass at the pose and no way to look again, and it moved
 * the map during the one action that has nothing to do with it. See the note in
 * SebaranSection.tsx.
 *
 * VERTICAL EXAGGERATION IS REAL AND IS DECLARED.
 *
 * The region is ~45km across; the tallest mast on it is 120m. At true scale a
 * tower would be a quarter of a pixel. Heights are therefore multiplied by
 * VERTICAL_EXAGGERATION, which preserves every tower's height RELATIVE to every
 * other — a pin twice as tall is a mast twice as tall — while making the
 * difference visible at all. The section caption says so in plain Indonesian;
 * an undeclared exaggeration would be a lie told with a chart.
 *
 * WHAT IT DRAWS, ALL OF IT DATA.
 *   - the ground     — the OSM boundary, hole and all
 *   - a disc         — coverage radius, from the same height x 8 formula /data-tower uses
 *   - a mast         — height, exaggerated but proportional
 *   - its colour     — the operator
 */

const VERTICAL_EXAGGERATION = 26;
const MIN_PITCH = 0.06; // radians, ~3.5deg. Never fully top-down: a little tilt reads as a map rather than a diagram.
const MAX_PITCH = 1.012; // ~58deg

interface IsoMapProps {
    points: TowerPoint[];
    /** Rotation about the vertical axis, in radians. Wraps freely. */
    yaw: number;
    /** 0 = almost overhead, 1 = a 58-degree three-quarter view. */
    pitch: number;
    className?: string;
}

/**
 * Resolve a design token to a canvas-usable colour.
 *
 * The tokens are bare HSL triplets ("0 100% 25.1%") so that Tailwind's
 * `hsl(var(--x) / <alpha-value>)` can inject opacity. Canvas has no such
 * facility, so the triplet is read once and wrapped here. Reading them rather
 * than hardcoding hex is what keeps this file honest when the palette moves.
 */
function token(name: string, alpha = 1): string {
    if (typeof window === 'undefined') return '#000';
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return '#000';
    return alpha === 1 ? `hsl(${raw})` : `hsl(${raw} / ${alpha})`;
}

const IsoMap: React.FC<IsoMapProps> = ({ points, yaw, pitch, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [boundary, setBoundary] = useState<Boundary | null>(null);
    const cameraRef = useRef({ yaw, pitch });
    const frameRef = useRef<number | null>(null);
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

    useEffect(() => {
        let alive = true;
        loadBoundary().then(
            (b) => alive && setBoundary(b),
            () => undefined,
        );
        return () => {
            alive = false;
        };
    }, []);

    /**
     * Everything that does not change with the camera, computed once.
     *
     * Degrees to kilometres, the boundary rings, the tower list sorted for the
     * painter's algorithm — none of it depends on pitch or yaw, so none of it
     * belongs in the draw loop. This is the difference between a scroll that
     * holds 60fps and one that does not.
     */
    const scene = useMemo(() => {
        if (!boundary) return null;

        // Only masts standing INSIDE the regency are drawn.
        //
        // A few of the records sit outside it — around Gunungpati and Sekaran,
        // which belong to Kota Semarang, and one west of Bandarjo. On a tilted
        // plane they came out as masts planted in mid-air beside the ground,
        // which reads as a rendering fault rather than as data, and including
        // them in the camera fit stretched the fitted area 30% wider than the
        // regency and shrank everything else to match.
        //
        // /data-tower still shows every one of them on the real map, which is
        // where a reader goes to ask where a specific tower stands.
        const frame = makeFrame(boundary.bbox);
        const visible = points.filter(([lat, lng]) => inBoundary(boundary, lng, lat));
        const bounds = contentBounds(frame, boundary, visible);

        const rings = boundary.polygons.map((poly) =>
            poly.map((ring) => ring.map(([lng, lat]) => toLocal(frame, lng, lat))),
        );

        const towers = visible
            .map(([lat, lng, height, owner]) => {
                const [x, y] = toLocal(frame, lng, lat);
                return {
                    x,
                    y,
                    owner,
                    height,
                    // km, exaggerated
                    z: (height / 1000) * VERTICAL_EXAGGERATION,
                    // km
                    coverage: coverageRadiusMetres(height) / 1000,
                };
            });
        // NOT sorted here. Depth order depends on yaw, and the reader can now
        // turn the map through a full circle, so what is "behind" changes with
        // the camera. The draw loop sorts per frame instead — see the note there.

        return { frame, bounds, rings, towers };
    }, [boundary, points]);

    const draw = useCallback(() => {
        frameRef.current = null;
        const canvas = canvasRef.current;
        if (!canvas || !scene) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { w, h, dpr } = sizeRef.current;
        if (!w || !h) return;

        const cam = cameraRef.current;
        const p = cam.pitch;
        const pitchRad = MIN_PITCH + (MAX_PITCH - MIN_PITCH) * p;
        const cosP = Math.cos(pitchRad);
        const sinP = Math.sin(pitchRad);
        const cosY = Math.cos(cam.yaw);
        const sinY = Math.sin(cam.yaw);

        const { bounds } = scene;
        const spanX = bounds.maxX - bounds.minX;
        const spanY = bounds.maxY - bounds.minY;
        const midX = (bounds.minX + bounds.maxX) / 2;
        const midY = (bounds.minY + bounds.maxY) / 2;

        // Fit the plan view, then leave headroom at the top for the masts that
        // the pitch lifts out of the ground plane.
        //
        // The fit uses the DIAGONAL of the plan rather than its width, because
        // the reader can now turn the map to any angle: sized to the width, the
        // region would clip its own corners the moment it was rotated 45
        // degrees.
        // 0.96, not 0.88. The diagonal fit already reserves the difference
        // between the region's width and its diagonal — about a quarter of the
        // box — for the corner the plan only reaches when it is turned 45
        // degrees. Spending another eighth on padding on top of that left the
        // regency using barely half the width of a 358px phone card, with the
        // masts too small to tell apart. The remaining 4% is the edge margin.
        const margin = 0.96;
        const diagonal = Math.hypot(spanX, spanY);
        const scale = Math.min((w * margin) / diagonal, (h * margin) / (diagonal * cosP + 2.2));
        const originX = w / 2;
        const originY = h / 2 + h * 0.12 * p; // p is the normalised pitch

        // Painter's algorithm, re-established every frame.
        //
        // Depth is the rotated northing, so it changes as the reader turns the
        // map; a fixed order would draw far masts over near ones as soon as the
        // camera passed 90 degrees. Sorting ~120 items costs microseconds, which
        // is nothing next to the fill this frame is about to do.
        const depthOf = (t: { x: number; y: number }) =>
            (t.x - midX) * sinY + (t.y - midY) * cosY;
        const ordered = [...scene.towers].sort((a, b) => depthOf(b) - depthOf(a));

        const project = (x: number, y: number, z: number): [number, number] => {
            const dx = x - midX;
            const dy = y - midY;
            const rx = dx * cosY - dy * sinY;
            const ry = dx * sinY + dy * cosY;
            // Screen Y grows downward; world north is +y, so it is negated.
            return [originX + rx * scale, originY - (ry * cosP + z * sinP) * scale];
        };

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const ink = token('--border-strong');
        const ground = token('--well');
        const groundEdge = token('--border');
        const brand = token('--primary');

        const ownerFill = [
            token('--data-1'),
            token('--data-2'),
            token('--data-3'),
            token('--data-4'),
            token('--data-5'),
            token('--ink-400'),
        ];
        const ownerSoft = [
            token('--data-1', 0.1),
            token('--data-2', 0.1),
            token('--data-3', 0.1),
            token('--data-4', 0.1),
            token('--data-5', 0.1),
            token('--ink-400', 0.1),
        ];

        // ---- the ground plane -------------------------------------------
        const tracePolygon = (poly: [number, number][][]) => {
            ctx.beginPath();
            for (const ring of poly) {
                ring.forEach(([x, y], i) => {
                    const [sx, sy] = project(x, y, 0);
                    if (i === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                });
                ctx.closePath();
            }
        };

        for (const poly of scene.rings) {
            tracePolygon(poly);
            ctx.fillStyle = ground;
            // "evenodd" is what keeps the Kota Salatiga enclave a hole. With the
            // default winding rule the city would be filled in as part of the
            // regency, which is a factual error, not a rendering nicety.
            ctx.fill('evenodd');
            ctx.strokeStyle = groundEdge;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // ---- coverage, on the ground ------------------------------------
        // Drawn before the masts so the masts stand ON the discs. A circle on a
        // plane seen at an angle is an ellipse: the minor axis is the major axis
        // foreshortened by cos(pitch), which is the entire trick.
        ctx.save();
        for (const tw of ordered) {
            if (tw.coverage <= 0) continue;
            const [cx, cy] = project(tw.x, tw.y, 0);
            const rx = tw.coverage * scale;
            const ry = rx * cosP;
            if (rx < 0.6) continue;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = ownerSoft[tw.owner] ?? ownerSoft[5];
            ctx.fill();
        }
        ctx.restore();

        // ---- the masts ---------------------------------------------------
        // Only worth drawing once the camera has tilted enough for a vertical
        // line to have any length on screen; below that they are sub-pixel and
        // just muddy the plan view.
        const mastVisible = sinP > 0.05;
        for (const tw of ordered) {
            const [bx, by] = project(tw.x, tw.y, 0);
            const fill = ownerFill[tw.owner] ?? ownerFill[5];

            if (mastVisible) {
                const [tx, ty] = project(tw.x, tw.y, tw.z);
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = fill;
                ctx.globalAlpha = 0.75;
                ctx.lineWidth = 1.4;
                ctx.stroke();
                ctx.globalAlpha = 1;

                ctx.beginPath();
                ctx.arc(tx, ty, 2.1, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();
            }

            // The footprint stays whatever the pitch, so a plan view still
            // reads as a scatter of towers rather than an empty outline.
            ctx.beginPath();
            ctx.arc(bx, by, mastVisible ? 1.1 : 2, 0, Math.PI * 2);
            ctx.fillStyle = mastVisible ? ink : fill;
            ctx.fill();
        }

        // ---- the tallest mast, called out --------------------------------
        const tallest = ordered.reduce((a, b) => (b.height > a.height ? b : a), ordered[0]);
        if (tallest && mastVisible) {
            const [tx, ty] = project(tallest.x, tallest.y, tallest.z);
            ctx.beginPath();
            ctx.arc(tx, ty, 5.5, 0, Math.PI * 2);
            ctx.strokeStyle = brand;
            ctx.lineWidth = 1.3;
            ctx.stroke();

            ctx.font =
                '500 11px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Figtree, sans-serif';
            ctx.fillStyle = brand;
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(tallest.height)} m`, tx, ty - 11);
        }
    }, [scene]);

    /**
     * Coalesce camera changes onto one frame.
     *
     * Only for scroll. A burst of scroll events must not turn into a burst of
     * redraws, and rAF is the right tool for that.
     */
    const schedule = useCallback(() => {
        if (frameRef.current === null) {
            frameRef.current = requestAnimationFrame(draw);
        }
    }, [draw]);

    useEffect(() => {
        cameraRef.current = { yaw, pitch };
        schedule();
    }, [yaw, pitch, schedule]);

    /**
     * The FIRST paint is drawn synchronously, not through rAF.
     *
     * Going through rAF here left the canvas blank in any context that never
     * runs an animation frame — a headless screenshot, a link-preview crawler,
     * a background tab. The map is this section's entire content, so "blank
     * until an animation frame happens" is the same failure the tower dots in
     * HeroDotMap had, in a different disguise.
     *
     * A layout effect also means the pixels are there in the same commit as the
     * element, so the section never flashes an empty box on a slow device.
     */
    useLayoutEffect(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        draw();
    }, [scene, draw]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            // Capped at 2: beyond that the extra pixels are invisible and the
            // fill rate on a mid-range phone is not.
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            sizeRef.current = { w: rect.width, h: rect.height, dpr };
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
            // Setting canvas.width wipes the bitmap, so this has to repaint
            // immediately rather than waiting for a frame — otherwise the map
            // is blank for the gap between a resize and the next rAF.
            draw();
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        return () => {
            observer.disconnect();
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [draw]);

    /*
     * THE LEGEND USED TO BE HERE, absolutely positioned over the bottom-left
     * corner of the canvas. It moved out to SebaranSection.
     *
     * Six operator names stacked vertically are about 120px tall and, at the
     * longest ("PT Telekomunikasi Nusantara"), 190px wide. That is a corner of
     * a 560px desktop canvas and most of a 320px phone one: on a phone the
     * list sat squarely on top of the regency it was supposed to explain.
     *
     * An overlay only works where there is guaranteed empty space underneath
     * it, and a map the reader can rotate through a full circle guarantees the
     * opposite — whatever corner is empty at one angle has the drawing in it at
     * another. So the legend is laid out in flow below the map now, where it
     * cannot collide with anything at any width or any camera angle.
     */
    return (
        <div className={cn('relative', className)}>
            <canvas
                ref={canvasRef}
                className="h-full w-full"
                role="img"
                aria-label={`Peta isometrik menara di Kabupaten Semarang. Tinggi batang menunjukkan tinggi menara, lingkaran menunjukkan perkiraan jangkauan, warna menunjukkan operator.`}
            />
        </div>
    );
};

export default IsoMap;
