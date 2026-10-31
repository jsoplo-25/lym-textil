import React from 'react';
import { History, X, Clock, Play, Pause, CheckCircle2, User, FileText } from 'lucide-react';
import type { BatchStatusLog } from '../types/production.types';

interface BatchStatusLogsModalProps {
  isOpen: boolean;
  batchNumber: string;
  logs?: BatchStatusLog[];
  onClose: () => void;
}

const formatDateTime = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'REQUESTED':
      return {
        label: 'Solicitud registrada',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: Clock,
      };
    case 'IN_PROGRESS':
    case 'IN_PREPARATION':
      return {
        label: 'En proceso',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Play,
      };
    case 'PAUSED':
      return {
        label: 'Pausado',
        bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
        icon: Pause,
      };
    case 'COMPLETED':
      return {
        label: 'Terminado',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        icon: Clock,
      };
  }
};

export const BatchStatusLogsModal: React.FC<BatchStatusLogsModalProps> = ({
  isOpen,
  batchNumber,
  logs = [],
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/15 border border-primary-500/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Bitácora de Estados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Lote N° {batchNumber} • Historial de Cambios y Observaciones
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Logs List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {logs.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Sin registros de bitácora
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Aún no se han registrado transiciones o motivos de pausa en este lote de producción.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
              {logs.map((log) => {
                const badge = getStatusBadge(log.status);
                const BadgeIcon = badge.icon;
                const userName = log.changedByUser
                  ? `${log.changedByUser.firstName} ${log.changedByUser.lastName}`.trim()
                  : 'Sistema / Automático';

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                    </div>

                    {/* Log Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2.5 shadow-2xs">
                      {/* Top meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}
                          >
                            <BadgeIcon className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </span>

                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDateTime(log.createdAt)}</span>
                          </span>
                        </div>

                        {/* User */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {userName}
                          </span>
                          {log.changedByUser?.workerId && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {log.changedByUser.workerId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes / Observation */}
                      {log.notes ? (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                            Motivo / Observación:
                          </span>
                          <p className="whitespace-pre-wrap">{log.notes}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin observación detallada</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cerrar Bitácora
          </button>
        </div>
      </div>
    </div>
  );
};
