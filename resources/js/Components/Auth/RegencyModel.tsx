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
 * Kabupaten Semarang as a solid object: an extruded slab, lit from above, with
 * the register's masts standing on it, turning slowly.
 *
 * WHY IT READS AS AN OBJECT AND NOT AS A CHART.
 *
 * It sits behind a login form, so it has to be legible at a glance, from across
 * a desk, while someone types a password. That is a different job from a data
 * graphic, and it is drawn differently: a thickness, a cast shadow and a 5km
 * graticule — the three things that make a shape look solid — and no legend, no
 * colour coding, no controls.
 *
 * The landing page used to carry a sibling of this, a flat isometric map the
 * reader could drag. It was removed: it drew the same towers the hero already
 * drew, and took 27% of the page to encode one variable (mast height) that a
 * resident does not arrive asking about. This one survives because a login
 * screen has no competing content and nothing better to say than whose system
 * this is.
 *
 * It is also deliberately not interactive. A drag target beside a password
 * field competes with text selection and can swallow a stray trackpad gesture;
 * a decoration must never be able to do that. Hence `pointer-events-none`, and
 * a rotation that runs on its own.
 *
 * WHY CANVAS 2D, AGAIN.
 *
 * Section 4.1 of the redesign plan rules out glb/gltf/fbx and the renderer each
 * one needs. An isometric projection is about 200 lines of arithmetic and runs
 * identically on whatever GL driver a mid-range Android shipped with — which,
 * on the login screen of a public-sector site, is most of the traffic.
 */

/** Heights are metres on a region 45km wide. Without this a mast is a quarter of a pixel. */
const VERTICAL_EXAGGERATION = 24;

/** Radians, ~35.5 degrees. A fixed three-quarter view; the reader has no camera here. */
const PITCH = 0.62;

/** Screen px from the top face to the bottom of the slab. Constant under rotation by construction. */
const SLAB_PX = 20;

/** Radians per second. A full turn takes about 105s — movement you notice only if you look. */
const YAW_PER_SECOND = 0.06;

/** The pose used when the reader has asked for reduced motion: three-quarters, stationary. */
const STATIC_YAW = -0.42;

/** Graticule spacing in kilometres. Fine enough to read as a grid, coarse enough not to hatch. */
const GRID_KM = 5;

/** ms between frames. 30fps is indistinguishable at this speed and halves the fill cost. */
const FRAME_MS = 1000 / 30;

/** [latitude, longitude, height in metres] — the wire format from App\Support\TowerShowcase. */
export type ShowcasePoint = [number, number, number];

interface RegencyModelProps {
    points: ShowcasePoint[];
    className?: string;
}

/**
 * Resolve a design token to a canvas colour.
 *
 * Tokens are bare HSL triplets so Tailwind can inject an alpha; canvas has no
 * equivalent, so the triplet is wrapped here. Only the `--ink-*`, `--brand-*`
 * and `--gold-*` ramps are read: the panel behind this canvas is deep maroon in
 * both themes, while the semantic tokens (`--well`, `--canvas`) inverte under
 * `.dark` and would put a near-black slab on a near-black ground.
 */
function token(name: string, alpha = 1): string {
    if (typeof window === 'undefined') return '#000';
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return '#000';
    return alpha === 1 ? `hsl(${raw})` : `hsl(${raw} / ${alpha})`;
}

const RegencyModel: React.FC<RegencyModelProps> = ({ points, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [boundary, setBoundary] = useState<Boundary | null>(null);
    const yawRef = useRef(STATIC_YAW);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
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
     * Everything independent of the camera, computed once.
     *
     * Degrees to kilometres, the rings, the mast list. None of it changes as the
     * model turns, so none of it belongs in a 30fps loop.
     */
    const scene = useMemo(() => {
        if (!boundary) return null;

        const frame = makeFrame(boundary.bbox);

        // Only masts standing INSIDE the regency are drawn. A handful of records
        // sit outside it — Gunungpati and Sekaran are Kota Semarang — and on a
        // slab with thickness they would float beside the object with nothing
        // underneath, which reads as a rendering fault rather than as data.
        // /data-tower still plots every one of them on the real map.
        const towers = points
            .filter(([lat, lng]) => inBoundary(boundary, lng, lat))
            .map(([lat, lng, height]) => {
                const [x, y] = toLocal(frame, lng, lat);
                return {
                    x,
                    y,
                    height,
                    z: (height / 1000) * VERTICAL_EXAGGERATION,
                    coverage: coverageRadiusMetres(height) / 1000,
                };
            });

        // Bounds from the boundary alone: every mast kept above is inside it.
        const bounds = contentBounds(frame, boundary, [] as TowerPoint[]);

        const rings = boundary.polygons.map((poly) =>
            poly.map((ring) => ring.map(([lng, lat]) => toLocal(frame, lng, lat))),
        );

        // The side walls are swept from a DECIMATED outline: every third vertex
        // of the outer rings, holes dropped. They are filled ten times a frame
        // to make the thickness, so their vertex count is the one number in this
        // file that actually costs something, and at 5km-per-pixel the dropped
        // vertices are invisible. Holes are skipped on purpose — leaving the
        // Salatiga enclave open to the wall colour is what makes it read as a
        // hole punched through the slab rather than a stain on the top.
        const skirt = boundary.polygons.map((poly) =>
            poly[0].filter((_, i) => i % 3 === 0).map(([lng, lat]) => toLocal(frame, lng, lat)),
        );

        const tallest = towers.reduce(
            (a, b) => (a === null || b.height > a.height ? b : a),
            null as (typeof towers)[number] | null,
        );

        return { bounds, rings, skirt, towers, tallest };
    }, [boundary, points]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !scene) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { w, h, dpr } = sizeRef.current;
        if (!w || !h) return;

        const cosP = Math.cos(PITCH);
        const sinP = Math.sin(PITCH);
        const yaw = yawRef.current;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);

        const { bounds } = scene;
        const spanX = bounds.maxX - bounds.minX;
        const spanY = bounds.maxY - bounds.minY;
        const midX = (bounds.minX + bounds.maxX) / 2;
        const midY = (bounds.minY + bounds.maxY) / 2;

        // Fit the DIAGONAL, not the width. The model turns through a full
        // circle, and a fit sized to the plan view clips its own corners the
        // moment it passes 45 degrees. The vertical budget also has to hold the
        // slab and the masts the pitch lifts off it, hence the two subtractions.
        const diagonal = Math.hypot(spanX, spanY);
        // The margins are as tight as the diagonal fit allows. Fitting the
        // diagonal already costs about a quarter of the box — it reserves room
        // for the corner the model only reaches at 45 degrees — so spending
        // another fifth on padding leaves the regency small in a large panel.
        // 26px is the headroom the label above the tallest mast needs.
        const scale = Math.max(
            0,
            Math.min((w * 0.94) / diagonal, (h * 0.92 - SLAB_PX - 26) / (diagonal * cosP)),
        );
        const originX = w / 2;
        const originY = h / 2 - SLAB_PX / 2;

        const project = (x: number, y: number, z: number): [number, number] => {
            const dx = x - midX;
            const dy = y - midY;
            const rx = dx * cosY - dy * sinY;
            const ry = dx * sinY + dy * cosY;
            // Screen y grows downward; world north is +y, so it is negated.
            return [originX + rx * scale, originY - (ry * cosP + z * sinP) * scale];
        };

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const faceHi = token('--ink-50');
        const faceLo = token('--ink-200');
        const edge = token('--ink-400');
        const grid = token('--ink-300', 0.55);
        const wallHi = token('--brand-700');
        const wallLo = token('--brand-950');
        const mastInk = token('--ink-700');
        const mastTip = token('--brand-800');
        const halo = token('--brand-800', 0.09);
        const accent = token('--gold');

        // ---- cast shadow -------------------------------------------------
        // A blurred fill of a 1,600-vertex path every frame is the one thing in
        // here that would actually cost milliseconds. A radial gradient sized to
        // the plan is free and, at this blur, indistinguishable.
        const shadowR = (diagonal / 2) * scale * 1.05;
        if (shadowR > 1) {
            ctx.save();
            ctx.translate(originX, originY + SLAB_PX + shadowR * cosP * 0.1);
            ctx.scale(1, cosP * 0.55);
            const shade = ctx.createRadialGradient(0, 0, shadowR * 0.2, 0, 0, shadowR);
            shade.addColorStop(0, 'rgba(0,0,0,0.45)');
            shade.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = shade;
            ctx.beginPath();
            ctx.arc(0, 0, shadowR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        /*
         * Path2D, not the context's own path.
         *
         * The default path bakes the transform in as each segment is ADDED, so
         * moving the context afterwards does not move the path — which is
         * exactly what the extrusion below needs to do. A Path2D holds user
         * coordinates and is transformed at fill time, so one path can be
         * stamped down the screen at ten different offsets.
         */
        const ringPath = (rings: [number, number][][]): Path2D => {
            const path = new Path2D();
            for (const ring of rings) {
                ring.forEach(([x, y], i) => {
                    const [sx, sy] = project(x, y, 0);
                    if (i === 0) path.moveTo(sx, sy);
                    else path.lineTo(sx, sy);
                });
                path.closePath();
            }
            return path;
        };

        const skirtPath = ringPath(scene.skirt);
        const topPath = ringPath(scene.rings.flat());

        // ---- the side walls ----------------------------------------------
        // A vertical extrusion projects to a pure downward screen offset at a
        // fixed pitch, so the wall IS the top outline swept down the screen. It
        // is stamped in 2px steps from the bottom up, the top third a shade
        // lighter, which is what gives the edge its lit-from-above falloff.
        // Opaque colours only: repeated alpha fills would accumulate into a
        // smear instead of a wall.
        for (let d = SLAB_PX; d >= 1; d -= 2) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, d * dpr);
            ctx.fillStyle = d / SLAB_PX > 0.45 ? wallLo : wallHi;
            ctx.fill(skirtPath);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // ---- the top face --------------------------------------------------
        const faceTop = originY - (diagonal / 2) * cosP * scale;
        const faceBottom = originY + (diagonal / 2) * cosP * scale;
        const faceFill = ctx.createLinearGradient(0, faceTop, 0, faceBottom);
        faceFill.addColorStop(0, faceHi);
        faceFill.addColorStop(1, faceLo);

        ctx.fillStyle = faceFill;
        // "evenodd" is what keeps Kota Salatiga a hole. Under the default
        // winding rule the city is filled in as part of the regency, which is a
        // factual error rather than a rendering nicety.
        ctx.fill(topPath, 'evenodd');

        // ---- the graticule, clipped to the face -----------------------------
        // Lines along the world axes at a fixed 5km, so they turn WITH the slab.
        // A screen-space grid would slide across it and read as an overlay; this
        // reads as a surface, which is the whole reason for drawing it.
        ctx.save();
        ctx.clip(topPath, 'evenodd');
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const half = diagonal / 2 + GRID_KM;
        for (let g = -half; g <= half; g += GRID_KM) {
            const [ax, ay] = project(midX + g, midY - half, 0);
            const [bx, by] = project(midX + g, midY + half, 0);
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            const [cx, cy] = project(midX - half, midY + g, 0);
            const [ex, ey] = project(midX + half, midY + g, 0);
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
        }
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.stroke(topPath);

        // ---- coverage, lying on the face ------------------------------------
        // A circle on a plane seen at an angle is an ellipse whose minor axis is
        // the major one foreshortened by cos(pitch). The radius comes from the
        // same height-times-eight rule of thumb /data-tower draws its coverage
        // with, via geo.ts, so the two drawings cannot quietly disagree.
        for (const tw of scene.towers) {
            if (tw.coverage <= 0) continue;
            const [cx, cy] = project(tw.x, tw.y, 0);
            const rx = tw.coverage * scale;
            if (rx < 0.8) continue;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, rx * cosP, 0, 0, Math.PI * 2);
            ctx.fillStyle = halo;
            ctx.fill();
        }

        // ---- the masts -------------------------------------------------------
        // Painter's algorithm, re-established every frame: depth is the rotated
        // northing, so what is "behind" changes as the model turns. Sorting a
        // few hundred items costs microseconds next to the fills above.
        const depthOf = (t: { x: number; y: number }) => (t.x - midX) * sinY + (t.y - midY) * cosY;
        const ordered = [...scene.towers].sort((a, b) => depthOf(b) - depthOf(a));

        const mastVisible = sinP > 0.05;
        for (const tw of ordered) {
            const [bx, by] = project(tw.x, tw.y, 0);
            const [tx, ty] = project(tw.x, tw.y, tw.z);

            if (mastVisible) {
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = mastInk;
                ctx.globalAlpha = 0.72;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            ctx.beginPath();
            ctx.arc(tx, ty, 1.9, 0, Math.PI * 2);
            ctx.fillStyle = mastTip;
            ctx.fill();
        }

        // ---- the tallest mast, named ------------------------------------------
        // The only label on the drawing, and the reason it is a drawing OF
        // something rather than a pattern: that is a real mast, and that is its
        // real height.
        const tallest = scene.tallest;
        if (tallest && tallest.height > 0) {
            const [tx, ty] = project(tallest.x, tallest.y, tallest.z);
            ctx.beginPath();
            ctx.arc(tx, ty, 5, 0, Math.PI * 2);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            ctx.font =
                '600 11px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Figtree, sans-serif';
            ctx.fillStyle = accent;
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(tallest.height)} m`, tx, ty - 10);
        }
    }, [scene]);

    /**
     * The FIRST paint is synchronous, not through rAF.
     *
     * Anywhere requestAnimationFrame never runs — a headless capture, a
     * link-preview crawler, a background tab — an rAF-gated canvas stays blank.
     * This panel is half the login screen, and the codebase has been bitten by
     * exactly this three times; see the note in resources/js/lib/motion.ts.
     */
    useLayoutEffect(() => {
        draw();
    }, [draw]);

    /**
     * The turn.
     *
     * Three things stop it, and all three are the same decision: do not spend a
     * phone's battery on a decoration nobody is looking at.
     *   - `prefers-reduced-motion: reduce` — parked at STATIC_YAW, no loop at all
     *   - a hidden tab — the loop is torn down, and rebuilt on return
     *   - a 30fps cap — at 0.06 rad/s, 60fps buys nothing a reader can see
     */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let running = false;

        const step = (now: number) => {
            rafRef.current = requestAnimationFrame(step);
            const dt = now - lastRef.current;
            if (dt < FRAME_MS) return;
            lastRef.current = now;
            // Clamped: a tab that was throttled hands back a multi-second delta,
            // and an unclamped one would snap the model a third of a turn.
            yawRef.current += (YAW_PER_SECOND * Math.min(dt, 250)) / 1000;
            draw();
        };

        const stop = () => {
            running = false;
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };

        const sync = () => {
            const shouldRun = !reduceQuery.matches && !document.hidden;
            if (shouldRun === running) return;
            if (!shouldRun) {
                stop();
                if (reduceQuery.matches) {
                    yawRef.current = STATIC_YAW;
                    draw();
                }
                return;
            }
            running = true;
            lastRef.current = performance.now();
            rafRef.current = requestAnimationFrame(step);
        };

        sync();
        reduceQuery.addEventListener('change', sync);
        document.addEventListener('visibilitychange', sync);
        return () => {
            stop();
            reduceQuery.removeEventListener('change', sync);
            document.removeEventListener('visibilitychange', sync);
        };
    }, [draw]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            // Capped at 2: past that the extra pixels are invisible and the fill
            // rate on a mid-range phone is not.
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            sizeRef.current = { w: rect.width, h: rect.height, dpr };
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
            // Setting canvas.width wipes the bitmap, so this repaints now rather
            // than waiting for the next frame.
            draw();
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            className={cn('pointer-events-none h-full w-full select-none', className)}
            role="img"
            aria-label="Model tiga dimensi wilayah Kabupaten Semarang dengan menara telekomunikasi yang berdiri di atasnya."
        />
    );
};

export default RegencyModel;
