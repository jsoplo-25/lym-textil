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
} from '../../lib/utils';
import { axiosInstance } from '../../api/axiosInstance';

export const SessionTimeoutModal: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.session.isAuthenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isExtending, setIsExtending] = useState(false);

  const lastActivityUpdateRef = useRef<number>(Date.now());

  // Handle Logout (Recarga completa y purga de memoria)
  const handleLogout = useCallback(() => {
    setIsOpen(false);
    dispatch(logout());
    window.location.href = '/login';
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
      // Throttle localStorage writes to at most once every 3 seconds
      if (now - lastActivityUpdateRef.current > 3000) {
        lastActivityUpdateRef.current = now;
        setLastActivity(now);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, [isAuthenticated, isOpen]);

  // Inactivity & Countdown Checker Interval
  useEffect(() => {
    if (!isAuthenticated) return;

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden transition-all transform scale-100">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 dark:bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Animated Icon Badge */}
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-2 ring-white dark:ring-slate-900">
              <Clock className="w-3 h-3" />
            </span>
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
            <span className="text-4xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {formattedTime}
            </span>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3 w-full">
            <button
              onClick={handleLogout}
              type="button"
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Cerrar sesión</span>
            </button>

            <button
              onClick={handleExtendSession}
              disabled={isExtending}
              type="button"
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
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
      </div>
    </div>
  );
};
