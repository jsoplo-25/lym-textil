import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type ModalIconVariant = 'emerald' | 'red' | 'amber' | 'slate';

/** Estilos del badge de ícono, reutilizados también por ConfirmModal. */
export const MODAL_ICON_VARIANT_STYLES: Record<ModalIconVariant, string> = {
  emerald: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  red: 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20',
  amber: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

const SIZE_STYLES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
} as const;

export interface ModalProps {
  isOpen: boolean;
  /** Si se omite, el modal no es descartable: sin botón X, sin click en el fondo ni Escape
   *  (para diálogos forzados como el aviso de inactividad de sesión). */
  onClose?: () => void;
  size?: keyof typeof SIZE_STYLES;
  title?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconVariant?: ModalIconVariant;
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

/**
 * Modal base reutilizable: portal + backdrop + bloqueo de scroll + Escape + tarjeta rounded-3xl.
 * Cubre tanto los modales de formulario (con header de ícono+título+X) como los diálogos
 * centrados (sin título, botón X flotante en la esquina) — según se pase o no `title`/`icon`.
 *
 * Para confirmaciones sí/no usa `ConfirmModal`, construido sobre este componente.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  description,
  subtitle,
  icon,
  iconVariant = 'emerald',
  children,
  className,
  isLoading = false,
  loadingMessage,
}) => {
  const dismissible = Boolean(onClose) && !isLoading;
  const desc = description || subtitle;

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (dismissible && e.key === 'Escape') onClose?.();
    };
    if (dismissible) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      if (dismissible) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  const hasHeader = Boolean(title || icon);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Backdrop click to close — solo si el modal es descartable y no está cargando */}
      {dismissible && <div className="fixed inset-0" onClick={onClose} />}

      <div
        className={cn(
          'relative z-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all my-8 overflow-hidden',
          SIZE_STYLES[size],
          className
        )}
      >
        {/* Animated Loading Bar at top edge */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden rounded-t-3xl bg-slate-100 dark:bg-slate-800 z-30">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-full animate-pulse" />
          </div>
        )}

        {/* Loading Overlay with blur, spinner and friendly message */}
        {isLoading && (
          <div className="absolute inset-0 z-30 rounded-3xl bg-white/80 dark:bg-slate-900/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 animate-fadeIn transition-all">
            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/80 dark:border-slate-700/80 text-center animate-scaleIn">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {loadingMessage || 'Guardando cambios...'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Por favor, espera un momento mientras procesamos la información.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasHeader ? (
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0',
                    MODAL_ICON_VARIANT_STYLES[iconVariant]
                  )}
                >
                  {icon}
                </div>
              )}
              <div>
                {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>}
                {desc && <p className="text-xs text-slate-400">{desc}</p>}
              </div>
            </div>

            {dismissible && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          dismissible && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}

        <div className={hasHeader ? 'mt-5' : undefined}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

Modal.displayName = 'Modal';
