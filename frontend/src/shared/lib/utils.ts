import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserProfile } from '../../entities/session/sessionTypes';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Token Storage (Enterprise In-Memory + httpOnly Cookie Compliance)
// Tokens are strictly managed in Memory and via secure httpOnly Cookies.
export const getStoredToken = (): string | null => {
  return null;
};

export const setStoredToken = (_token: string): void => {
  // Purge any legacy token from disk
  localStorage.removeItem('access_token');
};

// Refresh Token Storage
export const getStoredRefreshToken = (): string | null => {
  return null;
};

export const setStoredRefreshToken = (_token: string): void => {
  // Purge any legacy refresh token from disk
  localStorage.removeItem('refresh_token');
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

/**
 * Calculates user initials, e.g.:
 * - firstName="Jhon Anderson", lastName="Soplopuco Lavado" -> "JS"
 * - fullName="Jhon Anderson Soplopuco Lavado" -> "JS"
 * - firstName="Carlos", lastName="Gutiérrez" -> "CG"
 */
export const getUserInitials = (
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null
): string => {
  const cleanFirst = (firstName || '').trim();
  const cleanLast = (lastName || '').trim();

  // If both firstName and lastName are provided
  if (cleanFirst && cleanLast) {
    return `${cleanFirst.charAt(0)}${cleanLast.charAt(0)}`.toUpperCase();
  }

  // If only one combined string is available
  const combined = cleanFirst || cleanLast || (fullName || '').trim();
  if (!combined) return 'U';

  const parts = combined.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    // e.g. "Jhon Anderson Soplopuco Lavado" -> parts[0]='Jhon', parts[2]='Soplopuco' -> "JS"
    return `${parts[0].charAt(0)}${parts[2].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 2) {
    // e.g. "Jhon Soplopuco" -> "JS"
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  if (parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
};

