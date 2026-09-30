import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden transition-all transform scale-100">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 dark:bg-red-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
            <LogOut className="w-7 h-7" />
          </div>

          {/* Heading */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            ¿Deseas cerrar sesión?
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Se cerrará tu sesión actual en <span className="font-semibold text-slate-700 dark:text-slate-300">Textil L&M</span> y volverás a la pantalla de acceso.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
