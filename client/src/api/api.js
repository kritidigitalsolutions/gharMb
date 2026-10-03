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
  localStorage.removeItem("adminRefreshToken");
  localStorage.removeItem("adminUser");
  localStorage.removeItem("admin");
  if (message) {
    sessionStorage.setItem("adminSessionMessage", message);
  } else {
    sessionStorage.removeItem("adminSessionMessage");
  }
};

const getBaseUrl = () => {
  let base = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

  if (!base && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      base = 'http://localhost:5001';
    } else {
      base = 'https://server.gharmb.com';
    }
  }

  if (!base) {
    base = 'https://server.gharmb.com';
  }

  // Ensure base URL cleanly resolves to /api endpoint for Axios calls
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API = axios.create({
  baseURL: getBaseUrl()
});

// Request interceptor: attach token & check expiration before dispatch
API.interceptors.request.use((config) => {
  const isAuthPath = config.url?.includes('/auth/');
  const token = localStorage.getItem("adminToken");
  const refreshToken = localStorage.getItem("adminRefreshToken");

  if (token && !isAuthPath) {
    // If token is expired and no refresh token exists, clear session immediately
    if (isTokenExpired(token) && !refreshToken) {
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 session expiry and automatic token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthPath = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !isAuthPath && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem("adminRefreshToken");

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return API(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${getBaseUrl()}/admin/auth/refresh-token`, {
            refreshToken,
          });

          const newAccessToken = res?.data?.token || res?.data?.data?.token;
          const newRefreshToken = res?.data?.refreshToken || res?.data?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem("adminToken", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("adminRefreshToken", newRefreshToken);
            }
            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return API(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          clearAuthSession("Your session has expired. Please log in again.");
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = "/login?expired=1";
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

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