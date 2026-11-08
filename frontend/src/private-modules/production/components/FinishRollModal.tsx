import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Scale, Clock, User, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import type { RootState } from '../../../app/store';
import type { ProductionRoll, UpdateRollDTO, RollStatus } from '../types/production.types';
import { Modal } from '../../../shared/ui/Modal';
import { DatePicker } from '../../../shared/ui/DatePicker';
import { TimePicker } from '../../../shared/ui/TimePicker';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { productionService } from '../services/production.service';
import { formatLocalDate } from '../../../shared/lib/utils';
import { hasPermission } from '../../../shared/lib/roles';

interface FinishRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  roll: ProductionRoll | null;
  onSave: (data: UpdateRollDTO, rollId: string) => Promise<void>;
  batchTotalFabricKg?: number | null;
  existingRolls?: ProductionRoll[];
}

export const FinishRollModal: React.FC<FinishRollModalProps> = ({
  isOpen,
  onClose,
  roll,
  onSave,
  batchTotalFabricKg,
  existingRolls = [],
}) => {
  const currentUser = useSelector((state: RootState) => state.session.user);
  const canApprove = hasPermission(currentUser, 'production:approve');

  const [endOperator, setEndOperator] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [weight, setWeight] = useState('');
  const [observations, setObservations] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [operatorOptions, setOperatorOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const targetBatchKg =
    batchTotalFabricKg !== undefined && batchTotalFabricKg !== null && Number(batchTotalFabricKg) > 0
      ? Number(batchTotalFabricKg)
      : null;

  // Suma de peso de los demás rollos del lote (excluyendo este que se está pesando)
  const otherRollsWeight = (existingRolls || [])
    .filter((r) => r.id !== roll?.id)
    .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  // Kilos máximos que se pueden ingresar en este rollo para no superar el 100% de la meta registrada
  const maxAllowedKg = targetBatchKg !== null ? Math.max(0, targetBatchKg - otherRollsWeight) : null;

  // Validación reactiva de sobrepeso mientras se digita
  const inputWeightNum = parseFloat(weight);
  const isOverBatchLimit =
    targetBatchKg !== null &&
    maxAllowedKg !== null &&
    !isNaN(inputWeightNum) &&
    inputWeightNum > maxAllowedKg + 0.001;

  // Cálculos de proyección
  const projectedTotalKg = otherRollsWeight + (isNaN(inputWeightNum) || inputWeightNum < 0 ? 0 : inputWeightNum);
  const remainingAfterInputKg = targetBatchKg !== null ? Math.max(0, targetBatchKg - projectedTotalKg) : null;
  const projectedPercent = targetBatchKg !== null && targetBatchKg > 0 ? (projectedTotalKg / targetBatchKg) * 100 : 0;

  useEffect(() => {
    if (isOpen) {
      productionService
        .getOperators()
        .then((operators) => {
          if (operators && operators.length > 0) {
            const opts: SelectOption[] = operators.map((op) => ({
              value: op.name,
              label: op.name,
            }));
            setOperatorOptions(opts);
          }
        })
        .catch((err) => {
          console.error('Error loading operators:', err);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && roll) {
      const hasExistingFinish =
        (roll.weight !== null && roll.weight !== undefined && roll.weight > 0) ||
        Boolean(roll.endOperator) ||
        Boolean(roll.endDate) ||
        Boolean(roll.endTime);

      if (hasExistingFinish) {
        // Al editar un término existente, cargar los datos registrados
        setEndOperator(roll.endOperator || '');
        setEndDate(roll.endDate ? roll.endDate.split('T')[0] : '');
        setEndTime(roll.endTime || '');
        setWeight(
          roll.weight !== null && roll.weight !== undefined && roll.weight > 0
            ? String(roll.weight)
            : ''
        );
        setObservations(roll.observations || '');
      } else {
        // Al agregar término por primera vez, todos los campos inician completamente vacíos
        setEndOperator('');
        setEndDate('');
        setEndTime('');
        setWeight('');
        setObservations('');
      }

      setAutoApprove(false);
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, roll]);

  if (!roll) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    const parsedWeight = parseFloat(weight);
    if (!weight.trim() || isNaN(parsedWeight) || parsedWeight <= 0) {
      errors.weight = 'Ingresa el peso de balanza mayor a 0 Kg.';
    } else if (targetBatchKg !== null && maxAllowedKg !== null && parsedWeight > maxAllowedKg + 0.001) {
      errors.weight = `Supera la meta del lote (${targetBatchKg.toFixed(2)} Kg). Máximo permitido: ${maxAllowedKg.toFixed(2)} Kg (faltan ${maxAllowedKg.toFixed(2)} Kg).`;
    }

    if (!endOperator.trim()) {
      errors.endOperator = 'Selecciona el operario de término.';
    }

    if (!endDate.trim()) {
      errors.endDate = 'Ingresa la fecha de término.';
    }

    if (!endTime.trim()) {
      errors.endTime = 'Ingresa la hora de término.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.weight && targetBatchKg !== null && maxAllowedKg !== null && parsedWeight > maxAllowedKg + 0.001) {
        setError(
          `No se puede superar el kilaje total del lote (${targetBatchKg.toFixed(2)} Kg). Solo se aceptan hasta ${maxAllowedKg.toFixed(2)} Kg para este rollo (faltan ${maxAllowedKg.toFixed(2)} Kg).`
        );
      } else {
        setError('Por favor completa todos los campos obligatorios antes de finalizar.');
      }
      return;
    }

    // Determinar nuevo estado del rollo:
    let nextStatus: RollStatus = 'READY_FOR_APPROVAL';
    if (canApprove && autoApprove) {
      nextStatus = 'READY_FOR_PICKUP';
    } else if (roll.status === 'READY_FOR_PICKUP' || roll.status === 'DELIVERED') {
      nextStatus = roll.status;
    }

    // Regla de validación estricta para pasar a "Listo para recojo":
    // Todos los campos de inicio y término son obligatorios (solo observaciones es opcional)
    if (nextStatus === 'READY_FOR_PICKUP') {
      const missingFields: string[] = [];
      if (!roll.rollNumber?.trim()) missingFields.push('N° de Rollo');
      if (!roll.startOperator?.trim() || roll.startOperator === 'No asignado') missingFields.push('Operario Inicio');
      if (!roll.startDate?.trim()) missingFields.push('Fecha Inicio');
      if (!roll.startTime?.trim()) missingFields.push('Hora Inicio');
      if (!endOperator.trim() || endOperator.trim() === 'No asignado') missingFields.push('Operario Término');
      if (!endDate.trim()) missingFields.push('Fecha Término');
      if (!endTime.trim()) missingFields.push('Hora Término');
      if (!weight.trim() || isNaN(parsedWeight) || parsedWeight <= 0) {
        missingFields.push('Peso de Balanza (Kg)');
      }

      if (missingFields.length > 0) {
        setError(`Para pasar a "Listo para recojo" debe completar todos los campos obligatorios: ${missingFields.join(', ')}.`);
        return;
      }
    }

    try {
      setIsLoading(true);
      const payload: UpdateRollDTO = {
        endOperator: endOperator.trim(),
        endDate: endDate.trim(),
        endTime: endTime.trim(),
        weight: parsedWeight,
        observations: observations.trim() || undefined,
        status: nextStatus,
      };

      await onSave(payload, roll.id);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al guardar la finalización del rollo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isEditingFinish = roll.weight !== null && roll.weight !== undefined && roll.weight > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditingFinish ? `Editar Peso y Término - Rollo N° ${roll.rollNumber}` : `Finalizar y Pesar Rollo N° ${roll.rollNumber}`}
      description={
        isEditingFinish
          ? 'Modifica los kilos de balanza y datos de término del rollo'
          : 'Registra el peso de balanza y datos de término para enviar el rollo a visto bueno.'
      }
      icon={<Scale className="w-6 h-6 text-emerald-500" />}
      size="lg"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Resumen Bloqueado de Inicio de Rollo (Protección de trazabilidad) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              DATOS DE INICIO (PROTEGIDOS)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
              🟡 En Proceso / Tejiendo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">N° de Rollo</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                #{roll.rollNumber}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Operario Inicio</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {roll.startOperator || 'No asignado'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Inicio Registrado</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 block">
                {formatLocalDate(roll.startDate)} {roll.startTime ? `• ${roll.startTime}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Datos de Término (Operario, Fecha, Hora) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Select
              label="Operario Término *"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              options={operatorOptions}
              value={endOperator}
              onChange={(val) => {
                setEndOperator(val);
                if (fieldErrors.endOperator) {
                  setFieldErrors((prev) => {
                    const c = { ...prev };
                    delete c.endOperator;
                    return c;
                  });
                }
              }}
              placeholder="Seleccionar operario..."
            />
            {fieldErrors.endOperator && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.endOperator}</span>
              </p>
            )}
          </div>

          <div>
            <DatePicker
              label="Fecha Término *"
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                if (fieldErrors.endDate) {
                  setFieldErrors((prev) => {
                    const c = { ...prev };
                    delete c.endDate;
                    return c;
                  });
                }
              }}
              placeholder="Fecha..."
            />
            {fieldErrors.endDate && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.endDate}</span>
              </p>
            )}
          </div>

          <div>
            <TimePicker
              label="Hora Término *"
              value={endTime}
              onChange={(val) => {
                setEndTime(val);
                if (fieldErrors.endTime) {
                  setFieldErrors((prev) => {
                    const c = { ...prev };
                    delete c.endTime;
                    return c;
                  });
                }
              }}
              placeholder="HH:MM"
            />
            {fieldErrors.endTime && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.endTime}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. Peso de Balanza en Kg y Control de Kilaje de Lote */}
        <div className="space-y-2">
          {targetBatchKg !== null && maxAllowedKg !== null && (
            <div
              className={`p-3.5 rounded-2xl border text-xs transition-all ${
                isOverBatchLimit
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <Scale className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  Meta del Lote: <strong className="font-mono text-sm text-slate-900 dark:text-white">{targetBatchKg.toFixed(2)} Kg</strong>
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Acumulado otros rollos: <strong className="text-slate-700 dark:text-slate-300">{otherRollsWeight.toFixed(2)} Kg</strong>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                  Kilaje máximo aceptado para este rollo (para 100%):
                </span>
                <span
                  className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-lg ${
                    isOverBatchLimit
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100 ring-2 ring-rose-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                  }`}
                >
                  Máx. {maxAllowedKg.toFixed(2)} Kg
                </span>
              </div>

              {/* Alerta visible si se excede */}
              {isOverBatchLimit && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-0.5">
                    <p className="font-bold">¡Restricción de kilaje superada!</p>
                    <p className="text-[11px]">
                      El peso que ingresaste (<strong className="font-mono">{inputWeightNum.toFixed(2)} Kg</strong>) excede la meta del lote. Solo puedes ingresar hasta <strong className="font-mono">{maxAllowedKg.toFixed(2)} Kg</strong>, que es exactamente lo que falta para llegar al 100%.
                    </p>
                  </div>
                </div>
              )}

              {/* Progreso proyectado en tiempo real */}
              {!isOverBatchLimit && !isNaN(inputWeightNum) && inputWeightNum > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  <span>Proyección con este rollo: <strong>{projectedTotalKg.toFixed(2)} Kg</strong> ({projectedPercent.toFixed(1)}%)</span>
                  <span>Faltarían: <strong>{remainingAfterInputKg?.toFixed(2)} Kg</strong></span>
                </div>
              )}
            </div>
          )}

          <div
            className={`p-4 rounded-2xl border-2 space-y-2 transition-all ${
              fieldErrors.weight || isOverBatchLimit
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-400 dark:border-rose-700'
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40'
            }`}
          >
            <label className="block text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Peso de Balanza (Kilos) *
              </span>
              <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300">
                {targetBatchKg !== null && maxAllowedKg !== null
                  ? `Máx. permitido: ${maxAllowedKg.toFixed(2)} Kg`
                  : 'Obligatorio para finalizar'}
              </span>
            </label>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                max={targetBatchKg !== null && maxAllowedKg !== null ? maxAllowedKg : undefined}
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (fieldErrors.weight) {
                    setFieldErrors((prev) => {
                      const c = { ...prev };
                      delete c.weight;
                      return c;
                    });
                  }
                }}
                placeholder="0.00"
                className={`w-full pl-4 pr-16 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl text-xl font-mono font-black placeholder-slate-300 dark:placeholder-slate-600 focus:outline-hidden shadow-sm transition-all ${
                  fieldErrors.weight || isOverBatchLimit
                    ? 'border-rose-500 text-rose-700 dark:text-rose-300 focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                Kg
              </span>
            </div>
            {fieldErrors.weight ? (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.weight}</span>
              </p>
            ) : isOverBatchLimit && maxAllowedKg !== null ? (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Solo se aceptan hasta {maxAllowedKg.toFixed(2)} Kg para completar el 100% del lote.</span>
              </p>
            ) : (
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Digita los kilos netos exactos pesados en la balanza de planta.
              </p>
            )}
          </div>
        </div>

        {/* 4. Observaciones */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observaciones o Novedades (Opcional)
          </label>
          <input
            type="text"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ej. Cambio de cono, falla de aguja en los últimos metros, rollo limpio..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-xs transition-all"
          />
        </div>

        {/* 5. Opción exclusiva de Administrador / Asistente para Aprobación Inmediata */}
        {canApprove && (
          <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/60 dark:border-primary-800/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Aprobación Directa de Rollo
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Pasar a "Listo para recojo" y verificar disparo de alerta WhatsApp
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isLoading
                ? 'Guardando...'
                : isEditingFinish
                ? 'Guardar Peso y Término'
                : canApprove && autoApprove
                ? 'Finalizar y Aprobar Rollo'
                : 'Finalizar y Enviar a Visto Bueno'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
