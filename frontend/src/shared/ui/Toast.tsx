import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { RootState, AppDispatch } from '../../app/store';
import { removeToast } from '../../entities/toast/toastSlice';
import { cn } from '../lib/utils';
import type { AlertVariant } from './Alert';

const TOAST_DURATION_MS = 3500;

const VARIANT_STYLES: Record<AlertVariant, { container: string; Icon: React.ElementType }> = {
  success: { container: 'bg-primary-600', Icon: CheckCircle2 },
  error: { container: 'bg-red-600', Icon: AlertCircle },
  warning: { container: 'bg-accent-500', Icon: AlertTriangle },
  info: { container: 'bg-slate-800', Icon: Info },
};

/**
 * Stack de notificaciones flotantes, montado una única vez (App.tsx) y alimentado por
 * el hook useToast() desde cualquier componente. Reemplaza el toast de solo-éxito que
 * UsersPage y RolesPage montaban cada una por su cuenta, con el mismo setTimeout copiado.
 */
export const ToastContainer: React.FC = () => {
  const items = useSelector((state: RootState) => state.toast.items);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2.5 pointer-events-none">
      {items.map((item) => (
        <ToastItemView
          key={item.id}
          variant={item.variant}
          message={item.message}
          onDismiss={() => dispatch(removeToast(item.id))}
        />
      ))}
    </div>
  );
};

const ToastItemView: React.FC<{ variant: AlertVariant; message: string; onDismiss: () => void }> = ({
  variant,
  message,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { container, Icon } = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2 p-4 rounded-2xl text-white text-xs font-bold shadow-2xl animate-fadeIn max-w-sm',
        container
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
