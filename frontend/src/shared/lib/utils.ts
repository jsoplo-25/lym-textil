import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserProfile } from '../../entities/session/sessionTypes';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Token Storage
export const getStoredToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

// Refresh Token Storage
export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const setStoredRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

// User Profile Storage
export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem('user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserProfile): void => {
  localStorage.setItem('user_profile', JSON.stringify(user));
};

// Last Activity Timestamp Storage
export const getLastActivity = (): number => {
  const raw = localStorage.getItem('last_activity_time');
  const parsed = raw ? parseInt(raw, 10) : 0;
  return isNaN(parsed) ? 0 : parsed;
};

export const setLastActivity = (time = Date.now()): void => {
  localStorage.setItem('last_activity_time', time.toString());
};

// Configuración de tiempos de sesión
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 1 minuto de inactividad
export const WARNING_TIMEOUT_MS = 2 * 60 * 1000;    // 2 minutos de gracia en modal
export const TOTAL_SESSION_TIMEOUT_MS = INACTIVITY_TIMEOUT_MS + WARNING_TIMEOUT_MS;

export const getInactivityTimeoutMs = (): number => {
  return INACTIVITY_TIMEOUT_MS;
};

export const getWarningTimeoutMs = (): number => {
  return WARNING_TIMEOUT_MS;
};

export const getTotalSessionTimeoutMs = (): number => {
  return TOTAL_SESSION_TIMEOUT_MS;
};

// Validate if session is still alive upon browser refresh (F5)
export const isSessionValidOnReload = (): boolean => {
  const token = getStoredToken();
  const user = getStoredUser();
  const lastActivity = getLastActivity();

  if (!token || !user || !lastActivity) {
    return false;
  }

  const elapsed = Date.now() - lastActivity;
  if (elapsed >= getTotalSessionTimeoutMs()) {
    return false;
  }

  return true;
};

// Full Session Clear
export const clearStoredSession = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_profile');
  localStorage.removeItem('last_activity_time');
};
