import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { logout } from './sessionSlice';
import { useToast } from '../../shared/hooks/useToast';
import { axiosInstance } from '../../shared/api/axiosInstance';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_URL = rawApiUrl.replace(/\/+$/, '');

export const useSessionSync = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const session = useSelector((state: RootState) => state.session);
  const { isAuthenticated, user, token } = session;

  const activeSessionIdRef = useRef<string | undefined>(user?.sessionId);
  const activeUserIdRef = useRef<string | undefined>(user?.id);

  useEffect(() => {
    activeSessionIdRef.current = user?.sessionId;
    activeUserIdRef.current = user?.id;
  }, [user?.sessionId, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let eventSource: EventSource | null = null;
    let broadcastChannel: BroadcastChannel | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let isTerminated = false;

    const handleSessionTerminated = (reason: string) => {
      if (isTerminated) return;
      isTerminated = true;

      dispatch(logout());
      toast.error(reason);
      navigate('/login');
    };

    // 1. Sincronización inmediata entre pestañas del mismo navegador (BroadcastChannel)
    try {
      broadcastChannel = new BroadcastChannel('textil_lym_session_channel');
      broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'LOGIN' && data.userId === activeUserIdRef.current) {
          // Si otra pestaña inició sesión con un sessionId distinto, cerrar esta sesión inmediatamente
          if (data.sessionId && activeSessionIdRef.current && data.sessionId !== activeSessionIdRef.current) {
            handleSessionTerminated(
              'Tu sesión ha sido iniciada en otra pestaña. Se cerró esta sesión automáticamente.'
            );
          }
        }
      };
    } catch {
      // Fallback si BroadcastChannel no está disponible
    }

    // 2. Storage event fallback para navegadores que compartan almacenamiento local
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lym_session_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'LOGIN' && parsed.userId === activeUserIdRef.current) {
            if (parsed.sessionId && activeSessionIdRef.current && parsed.sessionId !== activeSessionIdRef.current) {
              handleSessionTerminated(
                'Tu sesión ha sido iniciada en otra pestaña. Se cerró esta sesión automáticamente.'
              );
            }
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Evento global disparado desde axiosInstance si una petición recibe 401 SESSION_SUPERSEDED
    const handleAxiosSuperseded = (e: Event) => {
      const custom = e as CustomEvent<{ message?: string }>;
      handleSessionTerminated(
        custom.detail?.message ||
          'Tu sesión ha sido iniciada en otro dispositivo o pestaña. La sesión actual se ha cerrado.'
      );
    };
    window.addEventListener('session_superseded', handleAxiosSuperseded);

    // 4. Server-Sent Events (SSE) para desconexión en TIEMPO REAL entre diferentes computadoras/dispositivos
    try {
      const streamUrl = `${API_URL}/auth/session-stream${
        token ? `?token=${encodeURIComponent(token)}` : ''
      }`;
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'SESSION_SUPERSEDED') {
            handleSessionTerminated(
              'Tu sesión ha sido iniciada en otro dispositivo o computadora. Se cerró esta sesión automáticamente.'
            );
          }
        } catch {}
      };

      eventSource.onerror = () => {
        // En caso de reconexión SSE temporal, el heartbeat mantendrá la verificación
      };
    } catch {
      // Error iniciando SSE
    }

    // 5. Heartbeat de respaldo periódico (cada 8 segundos) y al reenfocar la ventana
    const checkActiveSession = async () => {
      if (isTerminated) return;
      try {
        await axiosInstance.get('/auth/session-check');
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { code?: string } } };
        if (errorObj?.response?.data?.code === 'SESSION_SUPERSEDED') {
          handleSessionTerminated(
            'Tu sesión ha sido iniciada en otro dispositivo o pestaña. Se cerró esta sesión automáticamente.'
          );
        }
      }
    };

    heartbeatTimer = setInterval(checkActiveSession, 8000);

    const handleFocus = () => {
      checkActiveSession();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (broadcastChannel) broadcastChannel.close();
      if (eventSource) eventSource.close();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('session_superseded', handleAxiosSuperseded);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.id, dispatch, navigate, toast, token]);
};

export const SessionSyncWatcher: React.FC = () => {
  useSessionSync();
  return null;
};
