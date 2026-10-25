import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { axiosInstance } from '../../shared/api/axiosInstance';
import { setInitialized, logout } from './sessionSlice';
import type { RootState } from '../../app/store';
import { isSessionTimedOut, clearStoredSession } from '../../shared/lib/utils';

export const useInitSession = () => {
  const dispatch = useDispatch();
  const isInitialized = useSelector((state: RootState) => state.session.isInitialized);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      // Si pasaron más de 15 minutos mientras la laptop estuvo cerrada o inactiva, expulsar de inmediato
      if (isSessionTimedOut()) {
        clearStoredSession();
        if (isMounted) {
          dispatch(logout());
          dispatch(setInitialized({ isAuthenticated: false }));
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login?reason=timeout';
          }
        }
        return;
      }

      try {
        const response = await axiosInstance.get('/auth/me');
        if (isMounted) {
          if (response.data.success && response.data.data) {
            dispatch(
              setInitialized({
                isAuthenticated: true,
                user: response.data.data,
              })
            );
          } else {
            dispatch(setInitialized({ isAuthenticated: false }));
          }
        }
      } catch {
        if (isMounted) {
          dispatch(setInitialized({ isAuthenticated: false }));
        }
      }
    };

    if (!isInitialized) {
      checkSession();
    }

    return () => {
      isMounted = false;
    };
  }, [dispatch, isInitialized]);

  return { isInitialized };
};
