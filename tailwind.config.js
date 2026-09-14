// TowerTrack — Semarang Red design tokens
// Target: Tailwind CSS v3.4. Token values live in resources/css/app.css.
//
// Two things in here are load-bearing and easy to undo by accident:
//
// 1. The content glob includes .ts/.js. The old '*.tsx'-only glob left every
//    Tailwind class string inside resources/js/utils/statusHelpers.ts,
//    utils/foConstants.ts and utils/modalStyles.ts invisible to the JIT. Those
//    classes survive today only by coincidence (each also appears in some .tsx)
//    and would vanish the moment their last .tsx twin is edited.
//
// 2. `colors` sits under `extend`, so the ENTIRE stock Tailwind palette
//    survives. bg-gray-100 and text-red-600 keep working, which is what makes a
//    screen-by-screen migration possible instead of a big-bang rewrite.

import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

const t = (v) => `hsl(var(--${v}) / <alpha-value>)`;
const ramp = (name) =>
    Object.fromEntries(
        [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, t(`${name}-${s}`)])
    );

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,ts,jsx,tsx}',
    ],

    theme: {
        extend: {
            screens: { xs: '475px' },
            fontFamily: { sans: ['Figtree', ...defaultTheme.fontFamily.sans] },

            colors: {
                /* raw ramps — escape hatch while migrating */
                brand: { ...ramp('brand'), DEFAULT: t('brand-700') },
                ink: ramp('ink'),

                /* surfaces (shadcn/ui contract) */
                canvas: t('canvas'),
                background: t('background'),
                foreground: t('foreground'),
                border: t('border'),
                'border-strong': t('border-strong'),
                input: t('input'),
                ring: t('ring'),
                placeholder: t('placeholder'),

                card: { DEFAULT: t('card'), foreground: t('card-foreground') },
                popover: { DEFAULT: t('popover'), foreground: t('popover-foreground') },
                /* The inset ground. Darker than canvas AND card. */
                well: t('well'),

                /* brand roles — target: under 5% of pixels on any screen */
                primary: {
                    DEFAULT: t('primary'),
                    foreground: t('primary-foreground'),
                    hover: t('primary-hover'),
                    active: t('primary-active'),
                    soft: t('primary-soft'),
                    border: t('primary-border'),
                    strong: t('primary-strong'),
                },
                secondary: { DEFAULT: t('secondary'), foreground: t('secondary-foreground') },
                muted: { DEFAULT: t('muted'), foreground: t('muted-foreground') },
                accent: { DEFAULT: t('accent'), foreground: t('accent-foreground') },
                selected: { DEFAULT: t('selected'), foreground: t('selected-foreground') },

                /* semantic status.
                   bare token = FILL (calibrated for its -foreground on top).
                   `-strong`  = TEXT / ICON / 1px OUTLINE on light surfaces.
                   They are never interchangeable. */
                success: {
                    DEFAULT: t('success'), foreground: t('success-foreground'),
                    soft: t('success-soft'), border: t('success-border'), strong: t('success-strong'),
                },
                warning: {
                    DEFAULT: t('warning'), foreground: t('warning-foreground'),
                    soft: t('warning-soft'), border: t('warning-border'), strong: t('warning-strong'),
                },
                destructive: {
                    DEFAULT: t('destructive'), foreground: t('destructive-foreground'),
                    soft: t('destructive-soft'), border: t('destructive-border'), strong: t('destructive-strong'),
                },
                info: {
                    DEFAULT: t('info'), foreground: t('info-foreground'),
                    soft: t('info-soft'), border: t('info-border'), strong: t('info-strong'),
                },
                neutral: {
                    DEFAULT: t('neutral'), foreground: t('neutral-foreground'),
                    soft: t('neutral-soft'), border: t('neutral-border'), strong: t('neutral-strong'),
                },

                /* ceremonial — Sun Gold */
                gold: { DEFAULT: t('gold'), foreground: t('gold-foreground'), strong: t('gold-strong') },

                /* categorical data (charts + map) */
                data: { 1: t('data-1'), 2: t('data-2'), 3: t('data-3'), 4: t('data-4'), 5: t('data-5') },
                chart: { 1: t('chart-1'), 2: t('chart-2'), 3: t('chart-3'), 4: t('chart-4'), 5: t('chart-5') },

                /* map layer — Leaflet reads these as literals from @/lib/map-palette */
                map: {
                    casing: t('map-casing'),
                    marker: t('map-marker'),
                    selected: t('map-marker-selected'),
                    measure: t('map-measure'),
                    side: t('map-side'),
                },

                sidebar: {
                    DEFAULT: t('sidebar-background'),
                    foreground: t('sidebar-foreground'),
                    primary: t('sidebar-primary'),
                    'primary-foreground': t('sidebar-primary-foreground'),
                    accent: t('sidebar-accent'),
                    'accent-foreground': t('sidebar-accent-foreground'),
                    border: t('sidebar-border'),
                    ring: t('sidebar-ring'),
                },
            },

            // xl/lg/md resolve to 12/8/6px — byte-identical to Tailwind's defaults,
            // so all 426 existing rounded-lg sites are unchanged.
            // `sm` is deliberately NOT overridden: calc(var(--radius) - 4px) would
            // double rounded-sm from 2px to 4px across ~135 sites.
            borderRadius: {
                xl: 'calc(var(--radius) + 4px)',
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
            },

            // This DOES change 336 existing shadow sites (flatter, tinted with
            // ink-900 rather than pure black). Intentional, and the one visible
            // diff in Phase 0. xl/2xl map down to lg, flattening 53 sites.
            boxShadow: {
                xs: 'var(--shadow-xs)',
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                xl: 'var(--shadow-lg)',
                '2xl': 'var(--shadow-lg)',
            },

            // Must be a FUNCTION, not a string. Tailwind's ringWidth core plugin
            // seeds the base `*` rule with
            //   withAlphaValue(ringColor.DEFAULT, ringOpacity.DEFAULT)
            // which, given a plain string, either overrides a baked-in alpha
            // (a literal 'hsl(var(--ring) / 0.4)' comes out at 0.5) or fails to
            // resolve '<alpha-value>' and falls back to a hardcoded literal that
            // no longer tracks the token at all. The function form is the only
            // shape that keeps hsl(var(--ring)) intact AND honours the alpha.
            ringColor: {
                DEFAULT: ({ opacityValue }) =>
                    `hsl(var(--ring) / ${opacityValue === undefined ? '0.4' : opacityValue})`,
            },
            ringOpacity: { DEFAULT: '0.4' },
            ringWidth: { DEFAULT: '3px' },
            outlineColor: { DEFAULT: 'hsl(var(--ring))' },

            /* Motion scale. Durations mirror the --dur-* custom properties so a
               component can reach for either a utility or the raw token.
               Exit is ~0.7x enter throughout: on entry the eye has to find and
               parse the element; on exit it is already understood. */
            transitionDuration: {
                DEFAULT: '150ms',
                80: '80ms', 140: '140ms', 180: '180ms',
                200: '200ms', 220: '220ms', 260: '260ms', 320: '320ms',
            },
            transitionTimingFunction: {
                enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
                exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
                state: 'cubic-bezier(0.2, 0, 0, 1)',
                soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            keyframes: {
                // Renamed from `fadeInUp`: app.css redefines that keyframe name
                // globally after @tailwind utilities and wins the cascade, which
                // made the configured version dead code. Latent bug, fixed here.
                ttFadeInUp: {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                /* Only transform and opacity are animated anywhere in this file.
                   Animating layout properties is what causes jank on the
                   mid-range Android this is actually used on. */
                'rise-in': {
                    from: { opacity: '0', transform: 'translateY(var(--travel, 8px))' },
                    to: { opacity: '1', transform: 'none' },
                },
                'bar-grow': {
                    from: { transform: 'scaleX(0)' },
                    to: { transform: 'scaleX(1)' },
                },
                'rail-in': {
                    from: { transform: 'scaleY(0)' },
                    to: { transform: 'scaleY(1)' },
                },
            },
            animation: {
                // Was `ttFadeInUp 0.4s ease-out`, and was dead: app.css
                // redefined .animate-fade-in-up after @tailwind utilities, at
                // 1s with a 40px travel, and won the cascade. That override is
                // gone, so this entry is the live definition again — on the
                // scale this time.
                'fade-in-up': 'ttFadeInUp var(--dur-lg, 320ms) cubic-bezier(0.05, 0.7, 0.1, 1) both',
                'rise-in': 'rise-in var(--dur-md, 260ms) cubic-bezier(0.05, 0.7, 0.1, 1) both',
                // Was a bare 500ms, the last off-scale duration in this file.
                // A bar growing is a data reveal, so it takes the longest step
                // on the scale rather than a number of its own.
                'bar-grow': 'bar-grow var(--dur-lg, 320ms) cubic-bezier(0.05, 0.7, 0.1, 1) both',
                'rail-in': 'rail-in var(--dur-hover, 140ms) cubic-bezier(0.2, 0, 0, 1) both',
            },
        },
    },

    plugins: [
        animate,
        // NOTE: deliberately left at the plugin default (strategy = base + class).
        //
        // The migration plan calls for strategy:'class' so the plugin stops
        // injecting its own #2563eb focus ring and border-gray-500 on every
        // control, where they fight --input and --ring. That flip is correct
        // EVENTUALLY but must not happen yet: 'class' removes the base resets
        // from the 78 raw <input> and 50 raw <select> elements that currently
        // depend on them, which would leave them rendering as unstyled browser
        // defaults. Flip this to forms({ strategy: 'class' }) in Phase 1, in the
        // same commit that lands the Input/Select primitives carrying form-*.
        forms,
    ],
};
