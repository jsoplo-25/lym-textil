import React, { useEffect } from 'react';
import {
  History,
  X,
  Play,
  Scale,
  CheckCircle2,
  Package,
  Truck,
  Clock,
  User,
  Calendar,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import type { ProductionRoll, RollStatus, BatchStatusLog } from '../types/production.types';
import { formatLocalDate } from '../../../shared/lib/utils';

interface RollStatusLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roll: ProductionRoll | null;
  batchNumber?: string;
  logs?: BatchStatusLog[];
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

const formatTimeOnly = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getStatusBadge = (status?: RollStatus) => {
  switch (status) {
    case 'REGISTERED':
      return {
        label: 'Registrado',
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        dot: 'bg-slate-500',
      };
    case 'IN_PREPARATION':
      return {
        label: 'En Preparación / Tejido',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        dot: 'bg-amber-500',
      };
    case 'READY_FOR_APPROVAL':
      return {
        label: 'Por Aprobar (Visto Bueno)',
        bg: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30',
        dot: 'bg-amber-500 animate-ping',
      };
    case 'READY_FOR_PICKUP':
      return {
        label: 'Listo para Recojo',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        dot: 'bg-emerald-500',
      };
    case 'DELIVERED':
      return {
        label: 'Entregado',
        bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
        dot: 'bg-purple-500',
      };
    default:
      return {
        label: status || 'Sin estado',
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        dot: 'bg-slate-400',
      };
  }
};

export const RollStatusLogsModal: React.FC<RollStatusLogsModalProps> = ({
  isOpen,
  onClose,
  roll,
  batchNumber,
  logs = [],
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !roll) return null;

  const currentBadge = getStatusBadge(roll.status);
  const isFinished = Boolean(roll.endDate && roll.weight && Number(roll.weight) > 0);
  const isApproved = roll.status === 'READY_FOR_PICKUP' || roll.status === 'DELIVERED';
  const isReady = roll.status === 'READY_FOR_PICKUP' || roll.status === 'DELIVERED';
  const isDelivered = roll.status === 'DELIVERED';

  // Filtrar logs específicos que mencionan este rollo
  const rollLogs = logs.filter(
    (l) =>
      l.notes &&
      (l.notes.includes(`Rollo #${roll.rollNumber}`) ||
        l.notes.includes(`Rollo N° ${roll.rollNumber}`) ||
        l.notes.includes(`rollo #${roll.rollNumber}`) ||
        l.notes.includes(`rollo N° ${roll.rollNumber}`) ||
        l.notes.includes(`(#${roll.rollNumber})`))
  );

  const approvalLog = rollLogs.find(
    (l) => l.notes?.toLowerCase().includes('aprobad') || l.status === 'READY_FOR_PICKUP'
  );
  const deliveryLog = rollLogs.find(
    (l) => l.notes?.toLowerCase().includes('entreg') || l.status === 'DELIVERED'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-500/15 border border-primary-500/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Bitácora del Rollo #{roll.rollNumber}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentBadge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dot}`} />
                  {currentBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {batchNumber ? `Lote N° ${batchNumber}` : 'Detalle de Producción'} • Trazabilidad y Horas de Estado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                N° Rollo
              </span>
              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                #{roll.rollNumber}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Peso Balanza
              </span>
              <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                {roll.weight && Number(roll.weight) > 0 ? `${Number(roll.weight).toFixed(2)} Kg` : 'Pendiente'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hilado Asignado
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {roll.yarnName || 'Hilado general'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hora Registro
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate block">
                {formatTimeOnly(roll.createdAt)}
              </span>
            </div>
          </div>

          {/* Timeline of Lifecycle */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Línea de Tiempo del Rollo (Horas y Estados)
            </h4>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
              {/* Etapa 1: Inicio de Producción */}
              <div className="relative group">
                <div className="absolute -left-[33px] top-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs">
                  <Play className="w-3 h-3 fill-current" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      1. Inicio de Producción y Tejido
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLocalDate(roll.startDate)} • {roll.startTime || formatTimeOnly(roll.createdAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Operario Tejedor: <strong className="text-slate-800 dark:text-slate-200">{roll.startOperator || 'No asignado'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Creado en sistema: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(roll.createdAt)}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Etapa 2: Pesaje y Término */}
              <div className="relative group">
                <div
                  className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs ${
                    isFinished ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                </div>
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isFinished
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
                      : 'bg-slate-50/60 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      2. Pesaje en Balanza y Término
                    </span>
                    {isFinished ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatLocalDate(roll.endDate)} • {roll.endTime || formatTimeOnly(roll.updatedAt)}
                        </span>
                        <span className="text-[11px] font-mono font-extrabold text-white bg-emerald-600 px-2 py-0.5 rounded-lg shadow-xs">
                          {Number(roll.weight).toFixed(2)} Kg
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        Pendiente de pesaje
                      </span>
                    )}
                  </div>
                  {isFinished ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Operario Término: <strong className="text-slate-800 dark:text-slate-200">{roll.endOperator || 'No asignado'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>Peso Registrado: <strong className="font-mono text-slate-800 dark:text-slate-200">{Number(roll.weight).toFixed(2)} Kg</strong></span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      El rollo aún no ha completado el pesaje en balanza ni el registro de operario de término.
                    </p>
                  )}
                </div>
              </div>

              {/* Etapa 3: Control de Calidad / Visto Bueno */}
              <div className="relative group">
                <div
                  className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs ${
                    isApproved
                      ? 'bg-emerald-500 text-white'
                      : roll.status === 'READY_FOR_APPROVAL'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      3. Visto Bueno / Aprobación
                    </span>
                    {isApproved ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {approvalLog ? formatDateTime(approvalLog.createdAt) : formatDateTime(roll.updatedAt)}
                      </span>
                    ) : roll.status === 'READY_FOR_APPROVAL' ? (
                      <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        En espera desde {formatTimeOnly(roll.updatedAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isApproved
                      ? `Aprobado formalmente${
                          approvalLog?.changedByUser
                            ? ` por ${approvalLog.changedByUser.firstName} ${approvalLog.changedByUser.lastName}`
                            : ' por Administración / Asistente'
                        }. El rollo está habilitado para recojo.`
                      : roll.status === 'READY_FOR_APPROVAL'
                      ? 'El pesaje fue completado y se encuentra en espera de visto bueno del Asistente o Administrador.'
                      : 'Requiere completar el pesaje en balanza antes de pasar a visto bueno.'}
                  </p>
                </div>
              </div>

              {/* Etapa 4: Listo para Recojo */}
              <div className="relative group">
                <div
                  className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs ${
                    isReady
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Package className="w-3 h-3" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      4. Listo para Recojo
                    </span>
                    {isReady ? (
                      <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {approvalLog ? formatDateTime(approvalLog.createdAt) : formatDateTime(roll.updatedAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        No Disponible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isReady
                      ? 'El rollo se encuentra embalado y rotulado en almacén listo para ser retirado por el cliente o transportista.'
                      : 'Estará disponible una vez cuente con aprobación final.'}
                  </p>
                </div>
              </div>

              {/* Etapa 5: Entrega Final */}
              <div className="relative group">
                <div
                  className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xs ${
                    isDelivered
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Truck className="w-3 h-3" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      5. Entrega / Despacho Final
                    </span>
                    {isDelivered ? (
                      <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {deliveryLog ? formatDateTime(deliveryLog.createdAt) : formatDateTime(roll.updatedAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        Pendiente de Entrega
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isDelivered
                      ? `Entregado al proveedor/cliente${
                          deliveryLog?.changedByUser
                            ? ` registrado por ${deliveryLog.changedByUser.firstName} ${deliveryLog.changedByUser.lastName}`
                            : ''
                        }.`
                      : 'Pendiente de entrega o despacho masivo por el tejedor o administración.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registro detallado de eventos y transiciones */}
          {rollLogs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-primary-500" />
                Historial de Eventos del Rollo (Horas y Usuarios)
              </h4>
              <div className="space-y-2">
                {rollLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.notes}
                      </p>
                      {log.changedByUser && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.changedByUser.firstName} {log.changedByUser.lastName}
                          {log.changedByUser.workerId ? ` (${log.changedByUser.workerId})` : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones registradas */}
          {roll.observations && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Observaciones Registradas
              </span>
              <p className="text-xs text-amber-900 dark:text-amber-200">
                {roll.observations}
              </p>
            </div>
          )}

          {/* Auditoría / Fechas del Sistema */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Creado en sistema: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(roll.createdAt)}</strong>
            </div>
            <div>
              Última actualización: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(roll.updatedAt)}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
