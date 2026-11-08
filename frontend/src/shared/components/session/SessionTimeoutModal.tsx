import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, ShieldAlert, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import type { RootState } from '../../../app/store';
import { logout, updateTokens } from '../../../entities/session/sessionSlice';
import {
  getInactivityTimeoutMs,
  getWarningTimeoutMs,
  getTotalSessionTimeoutMs,
  getLastActivity,
  setLastActivity,
  getStoredRefreshToken,
  clearStoredSession,
} from '../../lib/utils';
import { axiosInstance } from '../../api/axiosInstance';
import { loginService } from '../../../public-modules/login/services/login.service';
import { Modal } from '../../ui/Modal';
import { Tooltip } from '../../ui/Tooltip';

export const SessionTimeoutModal: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isExtending, setIsExtending] = useState(false);

  const lastActivityUpdateRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    clearStoredSession();
    await loginService.logout().catch(() => {});
    dispatch(logout());
    window.location.href = '/login?reason=timeout';
  }, [dispatch]);

  // Handle Extending Session
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        const response = await axiosInstance.post('/auth/refresh', { refreshToken });
        const { token, accessToken, refreshToken: newRefreshToken } = response.data.data;
        const freshToken = accessToken || token;

        dispatch(
          updateTokens({
            token: freshToken,
            refreshToken: newRefreshToken,
          })
        );
      }

      // Reset activity timer
      setLastActivity(Date.now());
      lastActivityUpdateRef.current = Date.now();
      setIsOpen(false);
    } catch {
      // If refresh fails, log out
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  };

  // Activity Tracker: Records user interaction while modal is closed
  useEffect(() => {
    if (!isAuthenticated || isOpen) return;

    const handleUserActivity = () => {
      const now = Date.now();
      const lastActivity = getLastActivity();

      // Si ya se superó el tiempo máximo de inactividad, NO actualizar actividad: cerrar sesión inmediatamente
      if (lastActivity && now - lastActivity >= getTotalSessionTimeoutMs()) {
        handleLogout();
        return;
      }

      // Throttle localStorage writes to at most once every 3 seconds
      if (now - lastActivityUpdateRef.current > 3000) {
        lastActivityUpdateRef.current = now;
        setLastActivity(now);
      }
    };

    // Al despertar la laptop o volver a la pestaña, comprobar de inmediato sin esperar el intervalo
    const handleWakeUpOrFocus = () => {
      const last = getLastActivity();
      if (last && Date.now() - last >= getTotalSessionTimeoutMs()) {
        handleLogout();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleWakeUpOrFocus);
    window.addEventListener('focus', handleWakeUpOrFocus);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      document.removeEventListener('visibilitychange', handleWakeUpOrFocus);
      window.removeEventListener('focus', handleWakeUpOrFocus);
    };
  }, [isAuthenticated, isOpen, handleLogout]);

  // Inactivity & Countdown Checker Interval
  useEffect(() => {
    if (!isAuthenticated) return;

    // Chequeo inmediato al montar
    const initialLast = getLastActivity();
    if (initialLast && Date.now() - initialLast >= getTotalSessionTimeoutMs()) {
      handleLogout();
      return;
    }

    const checkInterval = setInterval(() => {
      const lastActivity = getLastActivity();
      if (!lastActivity) return;

      const now = Date.now();
      const elapsed = now - lastActivity;
      const inactivityMs = getInactivityTimeoutMs();
      const totalMs = getTotalSessionTimeoutMs();

      if (elapsed >= totalMs) {
        // Exceeded inactivity + grace period -> Automatic Logout
        handleLogout();
      } else if (elapsed >= inactivityMs) {
        // Exceeded inactivity -> Open warning modal with remaining seconds
        const timeLeftMs = totalMs - elapsed;
        const seconds = Math.max(0, Math.ceil(timeLeftMs / 1000));
        setSecondsRemaining(seconds);
        setIsOpen(true);
      } else {
        // Inside active window -> Modal should be closed
        if (isOpen) {
          setIsOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, isOpen, handleLogout]);

  // Dynamic values
  const warningSeconds = Math.max(1, Math.round(getWarningTimeoutMs() / 1000));
  const inactivityMinutes = Math.max(1, Math.round(getInactivityTimeoutMs() / (60 * 1000)));

  // Format seconds to MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage (0% to 100% of the grace window)
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / warningSeconds) * 100));

  return (
    // Sin `onClose`: es un modal forzado — no se descarta con Escape, click afuera ni botón X.
    <Modal isOpen={isOpen} size="md" className="p-6 sm:p-8">
      {/* Ambient Top Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary-500/15 dark:bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-accent-500/15 dark:bg-accent-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Animated Icon Badge */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 dark:bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <ShieldAlert className="w-8 h-8 animate-pulse text-primary-600 dark:text-primary-400" />
          </div>
          <Tooltip content="Sesión por expirar" position="right" className="absolute -bottom-1 -right-1">
            <span
              role="img"
              aria-label="Sesión por expirar"
              className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-white ring-2 ring-white dark:ring-slate-900"
            >
              <Clock className="w-3 h-3" />
            </span>
          </Tooltip>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          ¿Sigues trabajando en Textil L&M?
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Has estado inactivo durante <span className="font-semibold text-slate-700 dark:text-slate-200">{inactivityMinutes} {inactivityMinutes === 1 ? 'minuto' : 'minutos'}</span>.
          Por seguridad, tu sesión se cerrará automáticamente si no confirmas tu presencia.
        </p>

        {/* Glowing Countdown Timer Box */}
        <div className="mt-5 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-400 mb-1">
            Tiempo restante para cierre automático
          </span>
          <span className="text-4xl font-extrabold font-mono tracking-tight text-primary-600 dark:text-primary-400">
            {formattedTime}
          </span>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
          <button
            onClick={handleLogout}
            type="button"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Cerrar sesión</span>
          </button>

          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            type="button"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isExtending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Renovando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Continuar sesión</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

