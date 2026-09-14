import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';
import { LazyMotion, domAnimation } from 'motion/react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Update CSRF token from initial page props
        // This ensures token is set correctly on first load
        const initialCsrfToken = (props.initialPage?.props as any)?.csrfToken;
        if (initialCsrfToken && window.updateCsrfToken) {
            window.updateCsrfToken(initialCsrfToken);
        }

        // LazyMotion + `m` instead of the full `motion` import.
        //
        // Importing `motion` pulls the whole animation engine — roughly 34KB
        // gzip — into the initial bundle. `domAnimation` splits that into a
        // ~6KB shell plus a ~15KB feature chunk fetched alongside the page.
        // On the mid-range Android this app targets (see the note in
        // tailwind.config.js) that difference is a visible chunk of time to
        // interactive.
        //
        // `strict` makes the rule enforceable rather than aspirational: any
        // component that reaches for `motion.div` instead of `m.div` throws
        // in development, so the regression is caught at the call site
        // instead of six months later in a bundle audit.
        //
        // `domAnimation` deliberately EXCLUDES layout animation. Surfaces that
        // need `layout` / `layoutId` opt in locally via
        // `@/Components/Motion/LayoutMotion`, which nests a `domMax` provider
        // around just that subtree. Raising the feature set here would hand
        // every page the cost of a capability three of them use.
        root.render(
            <LazyMotion features={domAnimation} strict>
                <App {...props} />
            </LazyMotion>,
        );
    },
    progress: {
        // #800000 — brand-800, same as --primary.
        //
        // Was #4B5563, stock Tailwind gray-600, left over from before the token
        // migration; it belonged to neither the old palette nor this one. The
        // navigation bar is the one place brand is unambiguously right: it is a
        // 3px sliver that means "the app is working", and the palette's
        // "brand under 5% of pixels" budget is untroubled by it.
        color: '#800000',
    },
});

// Listen to Inertia navigation events to update CSRF token
// This is crucial after login/logout when session is regenerated
router.on('navigate', (event) => {
    const newCsrfToken = (event.detail.page?.props as any)?.csrfToken;
    if (newCsrfToken && window.updateCsrfToken) {
        window.updateCsrfToken(newCsrfToken);
    }
});

// Also listen to 'success' event for form submissions and redirects
router.on('success', (event) => {
    const newCsrfToken = (event.detail.page?.props as any)?.csrfToken;
    if (newCsrfToken && window.updateCsrfToken) {
        window.updateCsrfToken(newCsrfToken);
    }
});
