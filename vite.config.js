import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Manual chunks for better code splitting.
                //
                // THE OBJECT FORM IS LOAD-BEARING. DO NOT CONVERT THIS TO A
                // FUNCTION.
                //
                // A per-module function looks tidier and lets you group by
                // path, but it also gets asked about the synthetic modules
                // @rollup/plugin-commonjs generates to wrap CommonJS packages —
                // the helpers and the `?commonjs-exports` proxies. Routing
                // those by the same path rules separates a CJS module from its
                // own interop shim, and they end up in different chunks that
                // execute in the wrong order. Measured symptom: every page died
                // on `Cannot read properties of undefined (reading
                // 'createContext')` from vendor-inertia, because React had not
                // finished initialising when Inertia ran.
                //
                // The object form hands Rollup whole package entries and lets
                // it keep each package's interop intact.
                manualChunks: {
                    // Core React libraries
                    'vendor-react': ['react', 'react-dom'],

                    // Inertia and routing
                    'vendor-inertia': ['@inertiajs/react'],

                    // NO 'vendor-map' ENTRY. THIS IS DELIBERATE.
                    //
                    // It used to read `'vendor-map': ['leaflet', 'react-leaflet']`,
                    // and pinning those two into a chunk of their own had an
                    // effect nobody asked for: `vendor-ui` ended up importing a
                    // single deduplicated helper out of `vendor-map`
                    // (`import{r}from"./vendor-map-….js"`). One symbol, but a
                    // real import edge — so every page that touched a Headless
                    // UI or lucide component downloaded 153KB of mapping
                    // library. Login, the profile page, the forms and the
                    // landing page all paid 44.5KB gzip for a map they never
                    // render.
                    //
                    // Leaving Leaflet unpinned lets Rollup put it where its
                    // importers actually are. Measured after the change: total
                    // JS across all chunks moved 1319.7KB -> 1319.1KB, so
                    // nothing was duplicated, and Leaflet now appears in the
                    // static graph of only the two pages that genuinely load a
                    // map synchronously (/complaint via LocationSelectionInput,
                    // /data-fo via react-leaflet). /data-tower keeps getting it
                    // through its existing lazy import.
                    //
                    // Do not "restore" this entry without re-measuring.

                    // UI components
                    'vendor-ui': ['@headlessui/react', '@radix-ui/react-slot', 'lucide-react'],

                    // Animation engine.
                    //
                    // Measured at ~27KB gzip, loaded on first paint because
                    // app.tsx imports LazyMotion statically. That is the real
                    // cost of the feature set in use — LazyMotion is still
                    // earning its keep, just not as much as hoped: the layout
                    // projection system is verifiably absent from this chunk
                    // (no HTMLProjectionNode, no createProjectionNode), which
                    // is the ~10KB `domMax` would have added.
                    //
                    // Split out so it is cached across deploys rather than
                    // being re-downloaded with every application change.
                    'vendor-motion': ['motion'],
                },
                // Better asset file names
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                        return `assets/images/[name]-[hash][extname]`;
                    } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
                        return `assets/fonts/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
            },
        },
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.log in production
                drop_debugger: true,
            },
        },
        // Source maps for production debugging (optional)
        sourcemap: false,
    },
});
