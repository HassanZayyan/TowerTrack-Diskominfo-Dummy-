import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token from meta tag or cookie
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
} else {
    // Fallback: get from cookie
    const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
    if (csrfCookie) {
        window.axios.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(csrfCookie.split('=')[1]);
    }
}
