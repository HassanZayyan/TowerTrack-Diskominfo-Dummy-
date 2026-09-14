import React, { useCallback, useEffect, useRef, useState } from 'react';
import IsoMap from '@/Components/Landing/IsoMap';
import type { TowerPoint } from '@/lib/geo';

/**
 * The tilted distribution map, turned by the reader.
 *
 * IT USED TO BE DRIVEN BY SCROLL. IT IS NOT ANY MORE.
 *
 * A scroll-linked camera reads well in a demo and badly in use. The reader gets
 * exactly one pass at the pose — whatever angle the page happened to be at when
 * they arrived — and no way to look again without scrolling back and forth. It
 * also means the map is moving during the one action that has nothing to do
 * with it, which is the definition of motion that happens TO someone.
 *
 * Drag turns it instead. Horizontal drag rotates, vertical drag tilts, and the
 * reader stops where they want. That is the difference between a camera that
 * performs and one that answers a question: "is that cluster really east of
 * Ungaran, or is it just the angle?"
 *
 * WHAT THAT BUYS BESIDES CONTROL.
 *
 * `useScroll`, `useTransform` and `useMotionValueEvent` are gone, and with them
 * the only remaining reason the landing page pulled Motion's scroll machinery.
 * The camera is now two numbers in a ref, updated from pointer events.
 *
 * ACCESSIBILITY.
 *
 * The surface is focusable and answers the arrow keys, so the map is not
 * pointer-only. It carries `touch-action: none` so a drag rotates rather than
 * scrolling the page on a phone — but only horizontally-and-vertically INSIDE
 * the box; the page still scrolls normally everywhere around it.
 *
 * `prefers-reduced-motion` is not consulted here on purpose. That setting is
 * about motion the interface starts by itself. Nothing moves until the reader
 * moves it, and taking away a control because someone dislikes autoplay would
 * remove the very thing that makes this honest.
 */

interface SebaranSectionProps {
    points: TowerPoint[];
    owners: string[];
}

/** Opening pose: tilted enough to read as a landscape, square enough to read as a map. */
const INITIAL = { yaw: 0, pitch: 0.62 };

/** Drag sensitivity, in camera units per pixel. */
const YAW_PER_PX = 0.0042;
const PITCH_PER_PX = 0.0035;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const SebaranSection: React.FC<SebaranSectionProps> = ({ points, owners }) => {
    const [camera, setCamera] = useState(INITIAL);
    const [dragging, setDragging] = useState(false);
    const dragRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { x: e.clientX, y: e.clientY, yaw: camera.yaw, pitch: camera.pitch };
            setDragging(true);
        },
        [camera],
    );

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragRef.current;
        if (!start) return;
        setCamera({
            // Yaw wraps: there is no "too far round" when you are spinning a plan.
            yaw: start.yaw + (e.clientX - start.x) * YAW_PER_PX,
            // Pitch does not. Past flat or past straight-on there is nothing to see.
            pitch: clamp01(start.pitch - (e.clientY - start.y) * PITCH_PER_PX),
        });
    }, []);

    const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        dragRef.current = null;
        setDragging(false);
    }, []);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const YAW_STEP = 0.08;
        const PITCH_STEP = 0.06;
        let handled = true;
        setCamera((c) => {
            switch (e.key) {
                case 'ArrowLeft':
                    return { ...c, yaw: c.yaw - YAW_STEP };
                case 'ArrowRight':
                    return { ...c, yaw: c.yaw + YAW_STEP };
                case 'ArrowUp':
                    return { ...c, pitch: clamp01(c.pitch + PITCH_STEP) };
                case 'ArrowDown':
                    return { ...c, pitch: clamp01(c.pitch - PITCH_STEP) };
                case 'Home':
                    return INITIAL;
                default:
                    handled = false;
                    return c;
            }
        });
        if (handled) e.preventDefault();
    }, []);

    // Escape hatch for a reader who has rotated themselves somewhere useless.
    const reset = useCallback(() => setCamera(INITIAL), []);

    useEffect(() => {
        const el = surfaceRef.current;
        if (!el) return;
        const onDouble = () => reset();
        el.addEventListener('dblclick', onDouble);
        return () => el.removeEventListener('dblclick', onDouble);
    }, [reset]);

    return (
        <section className="border-b border-border bg-background" aria-labelledby="tt-sebaran">
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
                <div className="max-w-2xl">
                    <h2 id="tt-sebaran" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Sebaran menara, dilihat dari samping
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        Setiap batang adalah satu menara pada koordinat aslinya. Tingginya mengikuti tinggi
                        menara sebenarnya, dan lingkaran di bawahnya adalah perkiraan jangkauan yang dipakai
                        halaman Data Menara.
                    </p>
                </div>

                <div className="mt-8 overflow-hidden rounded-lg border border-border bg-canvas">
                    <div
                        ref={surfaceRef}
                        role="application"
                        tabIndex={0}
                        aria-label="Peta isometrik sebaran menara. Seret, atau gunakan tombol panah, untuk memutar dan memiringkan. Tekan Home untuk mengembalikan sudut awal."
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={onKeyDown}
                        className={[
                            'relative touch-none select-none outline-none',
                            'focus-visible:ring focus-visible:ring-inset',
                            dragging ? 'cursor-grabbing' : 'cursor-grab',
                        ].join(' ')}
                    >
                        <IsoMap
                            points={points}
                            yaw={camera.yaw}
                            pitch={camera.pitch}
                            className="h-[320px] w-full sm:h-[460px] lg:h-[560px]"
                        />

                        {/* The two controls stay pinned to the SAME side, one
                            at each end. Splitting them left and right put the
                            hint directly above the tallest masts on a phone. */}
                        <p
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-3 rounded-md border border-border bg-card/85 px-2.5 py-1 text-xs text-muted-foreground"
                        >
                            Seret untuk memutar
                        </p>

                        <button
                            type="button"
                            onClick={reset}
                            className="absolute bottom-3 right-3 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors duration-140 ease-state hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                        >
                            Sudut awal
                        </button>
                    </div>

                    {/*
                     * The operator legend, in flow rather than over the map.
                     *
                     * It used to be an overlay in the canvas's bottom-left
                     * corner. On a 390px phone the six operator names covered
                     * the western half of the regency — the legend hid the
                     * thing it was explaining. See the note in IsoMap.
                     *
                     * A wrapped row inside the same bordered card keeps it
                     * attached to the map it belongs to, and it simply takes
                     * more lines when the screen is narrow instead of taking
                     * someone else's space.
                     */}
                    {owners.length > 0 && (
                        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border bg-card px-3 py-2.5">
                            {owners.map((name, i) => (
                                <li
                                    key={name}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{
                                            background: `hsl(var(--${i < 5 ? `data-${i + 1}` : 'ink-400'}))`,
                                        }}
                                    />
                                    {name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* The exaggeration is stated, not hidden. A height encoding that
                    silently multiplies by 26 and does not say so is a chart that
                    lies, even when every ratio in it is correct. */}
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Tinggi batang dilebihkan sekitar 26 kali agar terlihat pada skala wilayah selebar 45 km.
                    Perbandingan antar-menara tetap apa adanya: batang dua kali lebih tinggi berarti menara dua
                    kali lebih tinggi. Lubang di tengah peta adalah Kota Salatiga, yang bukan bagian dari
                    Kabupaten Semarang. Menara di luar batas kabupaten tidak digambar di sini; semuanya ada di
                    halaman Data Menara.
                </p>
            </div>
        </section>
    );
};

export default SebaranSection;
