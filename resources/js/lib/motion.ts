import { useEffect, useState } from 'react';
import { useReducedMotion, type Transition, type Variants } from 'motion/react';

/**
 * The single source of truth for every JS-driven animation in the app.
 *
 * WHY THIS FILE EXISTS.
 *
 * `resources/css/app.css` already defines the motion scale as custom properties
 * (`--dur-*`, `--ease-*`, `--travel`). CSS transitions read them directly.
 * Motion/Framer cannot: its `transition` objects want numbers in SECONDS and
 * easing as a four-number cubic-bezier array, neither of which a
 * `var(--dur-md)` string can satisfy.
 *
 * So the scale is mirrored here ONCE, and every component imports from here.
 * The rule the codebase enforces: no component ever writes a duration literal.
 * If a value is missing from this file, the answer is to add it here with a
 * reason — not to inline `duration: 0.45` at the call site and move on.
 *
 * KEEP IN SYNC with app.css:210-223. The units differ (ms there, s here)
 * because that is what each runtime wants; the values must not.
 */

/** Durations in SECONDS (Motion's unit). Mirrors --dur-* which are in ms. */
export const DUR = {
    /** 80ms  — --dur-press. Tap/active feedback. Below this it reads as a glitch. */
    press: 0.08,
    /** 140ms — --dur-hover. Pointer-only affordances. */
    hover: 0.14,
    /** 200ms — --dur-sm. Toasts, crossfades, small state flips. */
    sm: 0.2,
    /** 260ms — --dur-md. The default. Modals, dialogs, panels. */
    md: 0.26,
    /** 320ms — --dur-lg. Large surfaces and first-paint reveals. */
    lg: 0.32,
    /** 180ms — --dur-md-out. Exit partner for `md` (0.7x, rounded to the scale). */
    mdOut: 0.18,
    /** 220ms — --dur-lg-out. Exit partner for `lg`. */
    lgOut: 0.22,
} as const;

/**
 * Easing curves as cubic-bezier control points.
 *
 * These are the same four curves as --ease-* in app.css. `enter` is heavily
 * front-loaded (an element arriving should be findable immediately, then
 * settle); `exit` is back-loaded (an element leaving should commit early and
 * get out of the way).
 */
export const EASE = {
    /** --ease-enter. Anything appearing. */
    enter: [0.05, 0.7, 0.1, 1],
    /** --ease-exit. Anything disappearing. */
    exit: [0.3, 0, 0.8, 0.15],
    /** --ease-state. Symmetric; for elements that move without appearing. */
    state: [0.2, 0, 0, 1],
    /** --ease-soft. The generic in-out, for colour and opacity only. */
    soft: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** 8px — --travel. The standard entrance offset. Anything larger reads as a slide. */
export const TRAVEL = 8;

/**
 * THE EXIT CONTRACT: exit is ~0.7x enter.
 *
 * Entering, the eye has to find the element and start reading it. Leaving, the
 * element has already been understood and is only in the way. Symmetric
 * durations make dismissals feel sluggish, which is the single most common
 * cause of "this app feels slow" on an interface that is not actually slow.
 */
export const enter = (duration: number = DUR.md): Transition => ({
    duration,
    ease: EASE.enter,
});

export const exit = (duration: number = DUR.mdOut): Transition => ({
    duration,
    ease: EASE.exit,
});

/** For elements that move or resize without entering or leaving. */
export const state = (duration: number = DUR.sm): Transition => ({
    duration,
    ease: EASE.state,
});

/**
 * Spring for layout animation and drag.
 *
 * Tuned for a mid-range Android: critically damped enough that it never
 * overshoots visibly (overshoot on a 60-row table reads as jitter, not bounce)
 * but fast enough to finish inside ~300ms.
 */
export const layoutSpring: Transition = {
    type: 'spring',
    stiffness: 420,
    damping: 38,
    mass: 0.9,
};

/**
 * Reduced-motion state plus the viewport class that parallax intensity depends on.
 *
 * Two rules from the redesign plan are encoded here so no component has to
 * remember them:
 *
 * 1. `prefers-reduced-motion: reduce` DISABLES scroll-linked and parallax
 *    motion entirely. Not "slows it down" — a slow parallax still moves the
 *    ground under someone who asked for it to stop.
 * 2. Below 768px, parallax travel is divided by 4. On a phone the scroll
 *    gesture is coarse and the viewport is short, so desktop travel values
 *    overshoot into nausea territory.
 *
 * `useReducedMotion()` from Motion is already reactive to the media query;
 * the viewport half is polled through a matchMedia listener so a desktop
 * resize or a tablet rotation is picked up without a reload.
 */
export function useMotionPrefs() {
    const reduce = useReducedMotion() ?? false;
    const [isCompact, setIsCompact] = useState(() =>
        typeof window === 'undefined' ? false : window.matchMedia('(max-width: 767px)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent) => setIsCompact(e.matches);
        mq.addEventListener('change', onChange);
        setIsCompact(mq.matches);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return {
        /** The user asked for less motion. Honour it by removing, not softening. */
        reduce,
        /** Viewport < 768px. */
        isCompact,
        /** Scroll-linked/parallax effects are allowed at all. */
        allowScrollMotion: !reduce,
        /**
         * Scale a desktop parallax travel value for the current context.
         * Returns 0 under reduced motion, travel/4 on compact viewports.
         */
        parallax: (travelPx: number) => (reduce ? 0 : isCompact ? travelPx / 4 : travelPx),
        /**
         * Wrap any transition so reduced motion collapses it to an instant cut.
         * Duration 0 rather than `false`, so AnimatePresence still resolves and
         * exit callbacks still fire — the element leaves, it just does not animate.
         */
        t: (transition: Transition): Transition => (reduce ? { duration: 0 } : transition),
    };
}

/* ------------------------------------------------------------------ *
 * Shared variants.
 *
 * `initial`/`animate`/`exit` triples that show up often enough that
 * redefining them per component invites drift. Components still own their
 * own transitions where the timing is meaningful.
 * ------------------------------------------------------------------ */

/** Dialog/modal panel. Scale is subtle on purpose — 0.97, not 0.9. */
export const panelVariants: Variants = {
    hidden: { opacity: 0, scale: 0.97, y: TRAVEL },
    visible: { opacity: 1, scale: 1, y: 0, transition: enter() },
    exit: { opacity: 0, scale: 0.98, y: 4, transition: exit() },
};

/** Scrim behind a modal. Never scales, never moves. */
export const scrimVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: DUR.sm, ease: EASE.soft } },
    exit: { opacity: 0, transition: { duration: DUR.mdOut, ease: EASE.soft } },
};

/** Toast: arrives from the right edge it is pinned to. */
export const toastVariants: Variants = {
    hidden: { opacity: 0, x: 24, scale: 0.98 },
    visible: { opacity: 1, x: 0, scale: 1, transition: enter(DUR.sm) },
    exit: { opacity: 0, x: 24, scale: 0.98, transition: exit(DUR.sm) },
};

/*
 * REMOVED: fadeVariants, riseVariants, staggerParent, staggerChild.
 *
 * They were the Motion entrance helpers the landing page used before its
 * reveals moved to the `tt-enter-*` CSS keyframes. They are gone rather than
 * left unused, because keeping them is an invitation to reintroduce the exact
 * failure that forced the move: Motion writes `initial` as an inline style and
 * needs an animation frame to leave it, so anywhere requestAnimationFrame does
 * not run — a crawler, a headless capture, a background tab — the content stays
 * at `opacity: 0`. It happened three times on this page alone.
 *
 * Use `tt-enter-up` with a per-element `--tt-delay` instead. See the block in
 * app.css.
 */

/**
 * Viewport options for `whileInView`.
 *
 * `once: true` is not optional. A reveal that re-runs every time a section
 * scrolls back into view turns a long page into a slideshow, and it re-hides
 * content the reader has already read.
 *
 * `amount: 0.25` fires when a quarter of the element is visible, which on a
 * tall section means "the reader has clearly arrived" rather than "one pixel
 * crossed the fold".
 */
export const inViewOnce = { once: true, amount: 0.25 } as const;
