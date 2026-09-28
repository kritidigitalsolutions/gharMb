import axios from "axios";

export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  if (token === 'mock_admin_token_2026') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload && payload.exp) {
      return payload.exp * 1000 < Date.now();
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const clearAuthSession = (message = null) => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("admin");
  if (message) {
    sessionStorage.setItem("adminSessionMessage", message);
  } else {
    sessionStorage.removeItem("adminSessionMessage");
  }
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
});

// Request interceptor: attach token & check expiration before dispatch
API.interceptors.request.use((config) => {
  const isAuthPath = config.url?.includes('/auth/login');
  const token = localStorage.getItem("adminToken");

  if (token && !isAuthPath) {
    if (isTokenExpired(token)) {
      clearAuthSession("Your admin session has expired. Please log in again.");
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = "/login?expired=1";
      }
      return Promise.reject(new Error("Admin session expired"));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle 401 session expiry cleanly (exclude login form submissions)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPath = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isAuthPath) {
      clearAuthSession("Your admin session has expired. Please log in again.");
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);

// Multi-tab storage sync: detect logout/session cleared from another tab
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'adminToken' && !e.newValue) {
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
  });
}

export default API;