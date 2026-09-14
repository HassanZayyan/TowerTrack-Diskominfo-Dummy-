import React, { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'motion/react';
import { EASE, inViewOnce, useMotionPrefs } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * The four numbers, counted up once.
 *
 * WHAT IS AND IS NOT GATED ON SCROLL HERE.
 *
 * The tiles themselves are NOT. They carry a `tt-enter-up` mount animation —
 * the CSS one, no observer — so they are present and readable in the first
 * painted frame. `StaggeredContainer.tsx` documents what the alternative costs:
 * gating body content on an IntersectionObserver left the stat tiles and the
 * map invisible in exactly the frame a link preview, a thumbnail and an
 * impatient reader all get. Verified again while building this page: with the
 * tiles behind `whileInView`, a full-page capture rendered three empty
 * sections.
 *
 * The COUNT is gated on scroll, and that is safe for one specific reason: the
 * element is never hidden. Before the animation runs the tile shows its real
 * final figure; the animation only replaces the digits while it is running. If
 * it never runs — reduced motion, no observer, a failed hydrate, a crawler —
 * the reader sees the correct number rather than a blank or a zero.
 *
 * That is the whole distinction: animating something already on screen is fine,
 * withholding it until scrolled to is not.
 */

export interface Stat {
    value: number;
    label: string;
    hint: string;
}

function useCountUp(target: number, active: boolean, reduce: boolean) {
    // null means "not counting" — render the real figure, not a zero.
    const [display, setDisplay] = useState<number | null>(null);

    useEffect(() => {
        if (reduce || !active) return;

        const controls = animate(0, target, {
            // Long enough to read as counting, short enough that a reader who
            // scrolled here deliberately is not kept waiting for a number.
            duration: 1.1,
            ease: EASE.enter,
            onUpdate: (v) => setDisplay(Math.round(v)),
            onComplete: () => setDisplay(null),
        });
        return () => controls.stop();
    }, [target, active, reduce]);

    return display ?? target;
}

const StatTile: React.FC<{ stat: Stat; active: boolean; index: number }> = ({
    stat,
    active,
    index,
}) => {
    const { reduce } = useMotionPrefs();
    const display = useCountUp(stat.value, active, reduce);

    return (
        <li
            className="tt-enter-up flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6"
            style={{ '--tt-delay': `${index * 70}ms` } as React.CSSProperties}
        >
            <span
                className="text-3xl font-bold tracking-tight tabular-nums text-foreground sm:text-4xl"
                // The live value churns while counting; a screen reader should
                // announce the final figure once, not every integer on the way.
                aria-hidden="true"
            >
                {display.toLocaleString('id-ID')}
            </span>
            <span className="sr-only">{stat.value.toLocaleString('id-ID')}</span>
            <span className="mt-1.5 text-sm font-medium text-foreground">{stat.label}</span>
            <span className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stat.hint}</span>
        </li>
    );
};

const StatsBand: React.FC<{ stats: Stat[]; className?: string }> = ({ stats, className }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, inViewOnce);

    return (
        <section
            ref={ref}
            className={cn('border-b border-border bg-canvas', className)}
            aria-labelledby="tt-angka"
        >
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
                <h2
                    id="tt-angka"
                    className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
                >
                    Angka
                </h2>
                <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <StatTile key={stat.label} stat={stat} active={inView} index={i} />
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default StatsBand;
