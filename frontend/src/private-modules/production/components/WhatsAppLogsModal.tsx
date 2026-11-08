import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { productionService } from '../services/production.service';
import type { WhatsAppNotificationLogItem } from '../types/production.types';
import { MessageSquare, CheckCircle2, AlertTriangle, Clock, Send, PhoneCall } from 'lucide-react';
import { useToast } from '../../../shared/hooks/useToast';

interface WhatsAppLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batchNumber: string;
  supplierName?: string;
  supplierPhone?: string;
  onRefreshBatch?: () => Promise<void>;
}

export const WhatsAppLogsModal: React.FC<WhatsAppLogsModalProps> = ({
  isOpen,
  onClose,
  batchId,
  batchNumber,
  supplierName,
  supplierPhone,
  onRefreshBatch,
}) => {
  const [logs, setLogs] = useState<WhatsAppNotificationLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const toast = useToast();

  const loadLogs = async () => {
    if (!batchId) return;
    try {
      setIsLoading(true);
      const data = await productionService.getWhatsAppLogs(batchId);
      setLogs(data || []);
    } catch (err) {
      console.error('Error al cargar historial de WhatsApp:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, batchId]);

  const handleManualTrigger = async () => {
    try {
      setIsTriggering(true);
      const result = await productionService.triggerWhatsAppThresholdCheck(batchId);
      if (result.checked) {
        if (result.newlyNotified && result.newlyNotified.length > 0) {
          toast.success(
            `¡Hito(s) alcanzado(s) y notificado(s): ${result.newlyNotified.map((m: number) => `${m}%`).join(', ')}!`
          );
        } else {
          toast.info(
            `Avance actual: ${result.percentage}% (${result.accumulatedKg} Kg). No hay nuevos hitos pendientes por notificar.`
          );
        }
      } else {
        toast.warning(result.reason || 'No se pudo realizar el cálculo de hitos.');
      }
      await loadLogs();
      if (onRefreshBatch) {
        await onRefreshBatch();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al verificar hitos de WhatsApp.';
      toast.error(msg);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Notificaciones WhatsApp - ${batchNumber}`}
      description={`Historial de alertas de recojo para el proveedor ${supplierName || ''}`}
      icon={<MessageSquare className="w-6 h-6 text-emerald-500" />}
      size="xl"
      className="max-h-[calc(100dvh-2rem)] flex flex-col"
      contentClassName="min-h-0 overflow-y-auto pr-1 sm:pr-2"
    >
      <div className="space-y-4">
        {/* Banner de Info Proveedor y Acción Manual */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {supplierName || 'Proveedor'}
              </span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                {supplierPhone ? `WhatsApp: ${supplierPhone}` : '⚠️ Sin número de WhatsApp en la ficha'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            <button
              type="button"
              onClick={handleManualTrigger}
              disabled={isTriggering}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              title="Evalúa si se alcanzaron hitos del 25%, 50%, 75% o 100% pendientes de notificar"
            >
              <Send className={`w-3.5 h-3.5 ${isTriggering ? 'animate-pulse' : ''}`} />
              <span>{isTriggering ? 'Verificando...' : 'Reevaluar Hitos'}</span>
            </button>
          </div>
        </div>

        {/* Lista de Registros */}
        {isLoading && logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">Cargando bitácora de notificaciones...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Aún no se han enviado notificaciones
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Cuando los rollos del lote pasen a "Listo para recojo" y alcancen el 25%, 50%, 75% o 100% de la tela proyectada, se enviará el mensaje automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.filter((l) => l.status !== 'SKIPPED').map((log) => {
              const isSent = log.status === 'SENT';
              const isSimulated = log.status === 'SIMULATED';
              const isFailed = log.status === 'FAILED';

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-emerald-500 text-white shadow-xs">
                        Hito {log.percentage}%
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {log.rollsCount} rollos ({log.readyKg.toFixed(2)} Kg)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Enviado (Meta API)
                        </span>
                      )}
                      {isSimulated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                          <Clock className="w-3 h-3" /> Modo Simulado (.env pendiente)
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" /> Error de envío
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo del mensaje */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {log.message}
                  </div>

                  {log.errorDetails && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-[11px] text-rose-600 dark:text-rose-400">
                      <strong>Detalle del error:</strong> {log.errorDetails}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Destino: {log.phoneNumber}</span>
                    {log.responseId && <span>ID: {log.responseId}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
