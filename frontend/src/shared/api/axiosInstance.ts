import axios from 'axios';
import {
  getStoredToken,
  setStoredToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  clearStoredSession,
  isSessionValidOnReload,
  setLastActivity,
} from '../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token & update last activity
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Refresh Token & Auth Errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Every successful API response also marks active session
    setLastActivity(Date.now());
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on login or refresh endpoint failures
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refreshToken = getStoredRefreshToken();

      // Only attempt refresh if session is still within valid window
      if (refreshToken && isSessionValidOnReload()) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token, accessToken, refreshToken: newRefreshToken } = res.data.data;
          const freshToken = accessToken || token;

          setStoredToken(freshToken);
          if (newRefreshToken) {
            setStoredRefreshToken(newRefreshToken);
          }
          setLastActivity(Date.now());

          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;

          processQueue(null, freshToken);
          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          clearStoredSession();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No valid refresh token or session expired
        clearStoredSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
