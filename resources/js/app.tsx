import '../css/app.css';
import './bootstrap';
import 'leaflet/dist/leaflet.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';

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

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
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
