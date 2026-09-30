import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { addToast } from '../../entities/toast/toastSlice';
import type { AlertVariant } from '../ui/Alert';

/**
 * Notificaciones flotantes globales, respaldadas por Redux (mismo patrón que el resto
 * del estado de la app — entities/session, entities/toast — en vez de un Context aparte).
 * El stack se renderiza una sola vez vía <ToastContainer /> montado en App.tsx.
 *
 *   const toast = useToast();
 *   toast.success('Usuario creado exitosamente.');
 */
export const useToast = () => {
  const dispatch = useDispatch<AppDispatch>();

  const show = (variant: AlertVariant, message: string) => {
    dispatch(addToast({ variant, message }));
  };

  return {
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    warning: (message: string) => show('warning', message),
    info: (message: string) => show('info', message),
  };
};
