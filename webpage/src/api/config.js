/**
 * Global Base URL Configuration (Without /api)
 * - Local: http://localhost:5001
 * - Deployment: https://ghar-mb-226x.vercel.app
 */

export const getBaseUrl = () => {
  // 1. Explicit environment variable (from .env or Vercel)
  if (import.meta.env.VITE_API_URL) {
    const raw = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
    // Strip trailing /api if entered by mistake
    return raw.replace(/\/api$/, '');
  }

  // 2. Local browser environment detection
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return 'http://localhost:5001';
    }
  }

  // 3. Live deployment backend URL
  return 'https://ghar-mb-226x.vercel.app';
};

export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`;
export default BASE_URL;
