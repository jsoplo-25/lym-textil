import axios from 'axios';
import { store } from '../../app/store';
import { updateTokens, logout } from '../../entities/session/sessionSlice';
import { setLastActivity } from '../lib/utils';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
// Remove trailing slash if present
const API_URL = rawApiUrl.replace(/\/+$/, '');

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

// Request Interceptor: Attach in-memory token if available + update last activity
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = store.getState().session.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // In case store is initializing
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Refresh via httpOnly cookie on 401
axiosInstance.interceptors.response.use(
  (response) => {
    setLastActivity(Date.now());
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si la sesión fue superada en otro dispositivo/pestaña, cerrar inmediatamente sin reintentar refresh
    if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_SUPERSEDED') {
      store.dispatch(logout());
      window.dispatchEvent(
        new CustomEvent('session_superseded', {
          detail: {
            message:
              error.response?.data?.error ||
              'Tu sesión ha sido iniciada en otro dispositivo o pestaña. Se ha cerrado esta sesión automáticamente.',
          },
        })
      );
      return Promise.reject(error);
    }

    // Do not attempt refresh on login, logout, or refresh endpoint failures
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/logout') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { token, accessToken, refreshToken: newRefreshToken } = res.data.data;
        const freshToken = accessToken || token;

        store.dispatch(
          updateTokens({
            token: freshToken,
            refreshToken: newRefreshToken,
          })
        );
        setLastActivity(Date.now());

        if (freshToken) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        }

        processQueue(null, freshToken);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        store.dispatch(logout());
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
