import React, { useState, useEffect } from 'react';
import { Layers, Save, User, Clock, FileText, Hash, Loader2, AlertCircle, Scale } from 'lucide-react';
import type { ProductionRoll, CreateRollDTO, UpdateRollDTO } from '../types/production.types';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { DatePicker } from '../../../shared/ui/DatePicker';
import { TimePicker } from '../../../shared/ui/TimePicker';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { productionService } from '../services/production.service';
import { getTodayLocalDate, toDatePickerValue } from '../../../shared/lib/utils';

interface RollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRollDTO | UpdateRollDTO, id?: string) => Promise<void>;
  editingRoll?: ProductionRoll | null;
  existingRolls?: ProductionRoll[];
  suggestedRollNumber?: string;
  suggestedStartOperator?: string;
  suggestedStartDate?: string;
  suggestedStartTime?: string;
}

export const ROLL_STATUS_OPTIONS: SelectOption[] = [
  { value: 'REGISTERED', label: 'Registrado' },
  { value: 'IN_PREPARATION', label: 'En preparación' },
  { value: 'READY_FOR_APPROVAL', label: 'Listo para aprobar' },
  { value: 'READY_FOR_PICKUP', label: 'Listo para recojo' },
  { value: 'DELIVERED', label: 'Entregado' },
];

export const RollModal: React.FC<RollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoll,
  existingRolls = [],
  suggestedRollNumber,
  suggestedStartOperator,
  suggestedStartDate,
  suggestedStartTime,
}) => {
  const [rollNumber, setRollNumber] = useState('');
  const [startOperator, setStartOperator] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [observations, setObservations] = useState('');

  const [operatorOptions, setOperatorOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    if (editingRoll) {
      setRollNumber(editingRoll.rollNumber || '');
      setStartOperator(editingRoll.startOperator || '');
      setStartDate(toDatePickerValue(editingRoll.startDate));
      setStartTime(editingRoll.startTime || '');
      setObservations(editingRoll.observations || '');
    } else {
      setRollNumber(suggestedRollNumber || '');
      setStartOperator(suggestedStartOperator || '');
      setStartDate(suggestedStartDate ? toDatePickerValue(suggestedStartDate) : getTodayLocalDate());
      setStartTime(suggestedStartTime || '');
      setObservations('');
    }
    setError(null);
    setFieldErrors({});
  }, [editingRoll, isOpen, suggestedRollNumber, suggestedStartOperator, suggestedStartDate, suggestedStartTime]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanRollNum = rollNumber.trim();

    // 1. Número de rollo obligatorio
    if (!cleanRollNum) {
      errors.rollNumber = 'El número de rollo es obligatorio (ej. 718, 719).';
    } else {
      // 2. Duplicado de rollo en el lote
      const isDuplicate = existingRolls.some(
        (r) => r.rollNumber.trim() === cleanRollNum && r.id !== editingRoll?.id
      );
      if (isDuplicate) {
        errors.rollNumber = `Ya existe el rollo N° ${cleanRollNum} en este lote.`;
      }
    }

    // 3. Operario de inicio obligatorio
    if (!startOperator.trim()) {
      errors.startOperator = 'El operario de inicio es obligatorio.';
    }

    // 4. Fecha y Hora de inicio obligatorias
    if (!startDate.trim()) {
      errors.startDate = 'La fecha de inicio es obligatoria.';
    }

    if (!startTime.trim()) {
      errors.startTime = 'La hora de inicio es obligatoria (ej. 08:30).';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor verifica los campos resaltados antes de guardar el rollo.');
      return false;
    }

    return true;
  };

  const handleRollNumberChange = (val: string) => {
    setRollNumber(val);
    if (fieldErrors.rollNumber) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.rollNumber;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      if (editingRoll) {
        // En edición solo actualizamos datos de inicio, preservando datos de término/peso si ya existían
        const payload: UpdateRollDTO = {
          rollNumber: rollNumber.trim(),
          startOperator: startOperator.trim(),
          startDate: startDate.trim(),
          startTime: startTime.trim(),
          observations: observations.trim() || undefined,
          endOperator: editingRoll.endOperator || undefined,
          endDate: editingRoll.endDate || undefined,
          endTime: editingRoll.endTime || undefined,
          weight: editingRoll.weight !== null && editingRoll.weight !== undefined ? editingRoll.weight : undefined,
          status: editingRoll.status || 'IN_PREPARATION',
        };
        await onSave(payload, editingRoll.id);
      } else {
        // En creación se inicia el rollo en máquina
        const payload: CreateRollDTO = {
          rollNumber: rollNumber.trim(),
          startOperator: startOperator.trim(),
          startDate: startDate.trim(),
          startTime: startTime.trim(),
          status: 'IN_PREPARATION',
          observations: observations.trim() || undefined,
        };
        await onSave(payload);
        setRollNumber('');
        setStartOperator('');
        setStartDate(getTodayLocalDate());
        setStartTime('');
        setObservations('');
      }

      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar datos de inicio del rollo:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (apiError && apiError.toLowerCase().includes('rollo')) {
        setFieldErrors((prev) => ({ ...prev, rollNumber: apiError }));
      }

      setError(apiError || 'Ocurrió un error al guardar los datos de inicio del rollo.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasWeightAlready = editingRoll && editingRoll.weight !== null && editingRoll.weight !== undefined && editingRoll.weight > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRoll ? `Editar Datos de Inicio - Rollo N° ${editingRoll.rollNumber}` : 'Iniciar Rollo de Producción'}
      description={
        editingRoll
          ? 'Modifica el número de rollo, tejedor y fecha/hora de arranque'
          : 'Registra el inicio del rollo en máquina (número, operario, fecha y hora de arranque)'
      }
      icon={<Layers className="w-6 h-6 text-primary-500" />}
      size="lg"
      className="max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
      isLoading={isLoading}
      loadingMessage={editingRoll ? 'Actualizando datos de inicio...' : 'Iniciando rollo en producción...'}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {/* Notificación si ya fue pesado */}
        {hasWeightAlready && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Este rollo ya cuenta con peso registrado de <strong>{editingRoll.weight} Kg</strong>.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md shrink-0">
              Usa el botón "Pesar Rollo" para modificar el peso
            </span>
          </div>
        )}

        {/* 1. N° Rollo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            N° de Rollo <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              autoFocus
              value={rollNumber}
              onChange={(e) => handleRollNumberChange(e.target.value)}
              placeholder="Ej. 718"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-bold transition-all font-mono ${
                fieldErrors.rollNumber
                  ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
          </div>
          {fieldErrors.rollNumber ? (
            <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.rollNumber}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">Número correlativo asignado al rollo en esta máquina</p>
          )}
        </div>

        {/* 2. Sección Datos de Arranque de Tejido */}
        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Datos de Arranque de Tejido
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Select
                label="Operario Inicio *"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                options={operatorOptions}
                value={startOperator}
                onChange={(val) => {
                  setStartOperator(val);
                  if (fieldErrors.startOperator) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.startOperator;
                      return copy;
                    });
                  }
                }}
                placeholder="Seleccionar operario..."
              />
              {fieldErrors.startOperator && (
                <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.startOperator}</span>
                </p>
              )}
            </div>

            <div>
              <DatePicker
                label="Fecha Inicio *"
                value={startDate}
                onChange={(val) => {
                  setStartDate(val);
                  if (fieldErrors.startDate) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.startDate;
                      return copy;
                    });
                  }
                }}
                placeholder="Seleccionar fecha..."
              />
              {fieldErrors.startDate && (
                <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.startDate}</span>
                </p>
              )}
            </div>

            <div>
              <TimePicker
                label="Hora Inicio *"
                value={startTime}
                onChange={(val) => {
                  setStartTime(val);
                  if (fieldErrors.startTime) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.startTime;
                      return copy;
                    });
                  }
                }}
                placeholder="HH:MM"
                align="right"
              />
              {fieldErrors.startTime && (
                <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.startTime}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Indicación sobre el peso y término */}
        {!editingRoll && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-3 shadow-xs">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <strong className="block font-bold">Datos de término y peso</strong>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                Al iniciar el rollo se registra en <strong>"En preparación"</strong>. Cuando termine de tejerse, usa el botón <strong>"Pesar Rollo"</strong> (⚖️) para ingresar los kilos netos y la hora de fin.
              </p>
            </div>
          </div>
        )}

        {/* 4. Observaciones */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notas / Indicaciones iniciales (Opcional)
          </label>
          <input
            type="text"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ej. Cambio de partida, aguja nueva, inicio de turno..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>
              {isLoading
                ? editingRoll
                  ? 'Guardando...'
                  : 'Iniciando...'
                : editingRoll
                ? 'Guardar Datos de Inicio'
                : 'Iniciar Rollo en Máquina'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
