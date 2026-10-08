import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
}) => {
  const dismissible = Boolean(onClose);
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
      {/* Backdrop click to close — solo si el modal es descartable */}
      {dismissible && <div className="fixed inset-0" onClick={onClose} />}

      <div
        className={cn(
          'relative z-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl transition-all my-8',
          SIZE_STYLES[size],
          className
        )}
      >
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
