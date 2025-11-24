import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Updates CSRF token in axios headers and meta tag
 * This ensures token stays in sync after session regeneration (login/logout)
 */
function updateCsrfToken(token?: string): void {
    // If token is provided, use it directly (from Inertia props)
    if (token) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        // Update meta tag for consistency
        const metaTag = document.head.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            metaTag.setAttribute('content', token);
        }
        return;
    }

    // Fallback: get from meta tag
    const metaToken = document.head.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        const tokenValue = metaToken.getAttribute('content');
        if (tokenValue) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenValue;
            return;
        }
    }

    // Last resort: get from cookie
    const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
    if (csrfCookie) {
        window.axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(csrfCookie.split('=')[1]);
    }
}

// Set initial CSRF token
updateCsrfToken();

// Export function for use in app.tsx
(window as any).updateCsrfToken = updateCsrfToken;
