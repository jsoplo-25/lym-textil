import React, { useState, useEffect } from 'react';
import { Pause, AlertCircle, Loader2, X } from 'lucide-react';

interface PauseBatchModalProps {
  isOpen: boolean;
  batchNumber: string;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  isLoading?: boolean;
}

export const PauseBatchModal: React.FC<PauseBatchModalProps> = ({
  isOpen,
  batchNumber,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNotes = notes.trim();
    if (!cleanNotes) {
      setError('Debes ingresar una observación o motivo para pausar el lote.');
      return;
    }
    await onConfirm(cleanNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Pause className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Pausar Lote de Producción
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Lote N° {batchNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo u Observación de la Pausa <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              disabled={isLoading}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe detalladamente el motivo (ej. Espera de hilado, mantenimiento correctivo de máquina, rotura de agujas, etc.)."
              className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 placeholder:text-slate-400 focus:outline-hidden transition-all resize-none ${
                error
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
            {error ? (
              <div className="flex items-center gap-1.5 mt-1.5 text-rose-600 dark:text-rose-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Esta observación quedará registrada en la bitácora con tu usuario, fecha y hora.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Pausando...</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Confirmar Pausa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
