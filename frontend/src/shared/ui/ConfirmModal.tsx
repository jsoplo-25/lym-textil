import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal, MODAL_ICON_VARIANT_STYLES } from './Modal';
import { cn } from '../lib/utils';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: React.ReactNode;
  /** 'danger' = acción roja (eliminar, cerrar sesión). 'primary' = acción verde (confirmar, continuar). */
  variant?: 'danger' | 'primary';
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

const VARIANT_ICON = { danger: 'red', primary: 'emerald' } as const;

const VARIANT_BUTTON = {
  danger: 'bg-red-600 hover:bg-red-500 shadow-red-600/25',
  primary: 'bg-primary-600 hover:bg-primary-500 shadow-primary-600/25',
} as const;

const VARIANT_GLOW = {
  danger: 'bg-red-500/10 dark:bg-red-500/15',
  primary: 'bg-primary-500/10 dark:bg-primary-500/15',
} as const;

/**
 * Diálogo de confirmación sí/no construido sobre `Modal`: ícono centrado, título,
 * descripción y dos botones (Cancelar + acción). Reemplaza los diálogos de confirmación
 * que antes reimplementaban esta misma estructura a mano (eliminar usuario, cerrar sesión).
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  variant = 'danger',
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      isLoading={isLoading}
      loadingMessage={variant === 'danger' ? 'Eliminando registro...' : 'Procesando confirmación...'}
    >
      <div
        className={cn(
          'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none',
          VARIANT_GLOW[variant]
        )}
      />

      <div className="relative flex flex-col items-center text-center">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
            MODAL_ICON_VARIANT_STYLES[VARIANT_ICON[variant]]
          )}
        >
          {icon ?? <AlertTriangle className="w-7 h-7" />}
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2',
              VARIANT_BUTTON[variant]
            )}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Procesando...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmModal.displayName = 'ConfirmModal';
