import React from 'react';
import { LazyMotion, domMax } from 'motion/react';

/**
 * Opt-in provider for layout animation.
 *
 * `app.tsx` loads `domAnimation`, which covers transform, opacity, colour,
 * gestures and `AnimatePresence` — everything all but three surfaces in this
 * app need. What it deliberately leaves out is the layout engine behind
 * `layout`, `layout="position"` and `layoutId`, because that engine has to
 * measure the DOM on every commit and costs roughly 10KB gzip on top.
 *
 * Three places actually need it, all of them tables whose rows reorder while
 * the reader is looking at them:
 *
 *   - `Components/DataFo/FoTable.tsx`      — client-side search/type filter
 *   - `Components/Admin/ManagementTable.tsx` — client-side filter
 *   - `Pages/Admin/FoManagement/ProvidersIndex.tsx` — client-side filter
 *
 * They wrap their table in this. Everything else on the page keeps the small
 * feature set. Nesting is additive and safe: Motion registers features into one
 * global registry, so the inner provider simply raises the ceiling for its own
 * subtree, and `strict` still holds — `m.tr`, never `motion.tr`.
 *
 * DO NOT promote this to the root to save a wrapper. The whole point of the
 * split is that /data-tower, the admin dashboard and every form page never pay
 * for a capability they do not use.
 */
export default function LayoutMotion({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={domMax} strict>
            {children}
        </LazyMotion>
    );
}
