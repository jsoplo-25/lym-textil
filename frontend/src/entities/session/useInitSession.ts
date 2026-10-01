import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { axiosInstance } from '../../shared/api/axiosInstance';
import { setInitialized } from './sessionSlice';
import type { RootState } from '../../app/store';

export const useInitSession = () => {
  const dispatch = useDispatch();
  const isInitialized = useSelector((state: RootState) => state.session.isInitialized);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
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
