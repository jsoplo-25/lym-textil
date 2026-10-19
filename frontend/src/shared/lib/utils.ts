import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Refresh Token Storage (Compatibility check)
export const getStoredRefreshToken = (): string | null => {
  return null;
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
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad
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

/**
 * Retorna la fecha local en formato YYYY-MM-DD sin desfase UTC.
 */
export const getTodayLocalDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha ISO o YYYY-MM-DD a formato visible DD/MM/YYYY
 * evitando el desfase de zona horaria que resta un día.
 */
export const formatLocalDate = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '-';
  const str = typeof dateVal === 'string' ? dateVal : dateVal.toISOString();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return new Date(dateVal).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Convierte cualquier valor de fecha recibido a YYYY-MM-DD para inicializar DatePickers
 */
export const toDatePickerValue = (dateVal?: string | Date | null): string => {
  if (!dateVal) return getTodayLocalDate();
  const str = typeof dateVal === 'string' ? dateVal : dateVal.toISOString();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return getTodayLocalDate();
};

