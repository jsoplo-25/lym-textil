import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_URL = rawApiUrl.replace(/\/+$/, '');

const PRODUCTION_UPDATED_EVENT = 'production:rolls-updated';

/**
 * Mantiene una conexión SSE con el backend. Cuando alguien (en cualquier equipo) cambia
 * lotes, rollos o estados, dispara `production:rolls-updated` para que cabecera,
 * dashboard, lista y detalle se refresquen solos, sin recargar la pantalla.
 */
export const useProductionRealtime = () => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.session);

  useEffect(() => {
    if (!isAuthenticated) return;

    let eventSource: EventSource | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const notify = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        window.dispatchEvent(new CustomEvent(PRODUCTION_UPDATED_EVENT, { detail: { remote: true } }));
      }, 300);
    };

    try {
      const url = `${API_URL}/production/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      eventSource = new EventSource(url, { withCredentials: true });
      eventSource.onmessage = notify;
      // Al reconectar tras una caída se pudo perder algún evento: refrescar por seguridad
      eventSource.onopen = notify;
    } catch {
      // Sin SSE: quedan el sondeo de respaldo y el refresco al volver a la pestaña
    }

    // Respaldo: al volver a la pestaña o recuperar red, refrescar
    const handleVisible = () => {
      if (document.visibilityState === 'visible') notify();
    };
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('online', notify);

    return () => {
      if (debounce) clearTimeout(debounce);
      eventSource?.close();
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('online', notify);
    };
  }, [isAuthenticated, token]);
};
