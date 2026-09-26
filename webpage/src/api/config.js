/**
 * Global API Base URL Configuration
 * Automatically resolves the correct backend endpoint:
 * - On Local Development (localhost / 127.0.0.1) -> http://localhost:5001/api
 * - On Live Deployment (Vercel / any other device) -> https://ghar-mb-226x.vercel.app/api
 * - Or uses VITE_API_URL if configured
 */

export const getApiBaseUrl = () => {
  // 1. Explicit environment variable (from .env or Vercel dashboard)
  if (import.meta.env.VITE_API_URL) {
    const raw = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    if (raw) {
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    }
  }

  // 2. Local browser environment detection
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return 'http://localhost:5001/api';
    }
  }

  // 3. Production live backend default fallback
  return 'https://ghar-mb-226x.vercel.app/api';
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
