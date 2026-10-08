import React, { useState, useEffect } from 'react';
import { Layers, Save, User, Clock, Scale, FileText, Hash, Activity } from 'lucide-react';
import type { ProductionRoll, CreateRollDTO, UpdateRollDTO, RollStatus } from '../types/production.types';
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
  suggestedRollNumber?: string;
}

export const ROLL_STATUS_OPTIONS: SelectOption[] = [
  { value: 'REGISTERED', label: 'Registrado' },
  { value: 'IN_PREPARATION', label: 'En preparación' },
  { value: 'READY_FOR_PICKUP', label: 'Listo para recojo' },
  { value: 'DELIVERED', label: 'Entregado' },
];

export const RollModal: React.FC<RollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRoll,
  suggestedRollNumber,
}) => {
  const [rollNumber, setRollNumber] = useState('');
  const [startOperator, setStartOperator] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');

  const [endOperator, setEndOperator] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState<RollStatus>('REGISTERED');
  const [observations, setObservations] = useState('');
  const [operatorOptions, setOperatorOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setEndOperator(editingRoll.endOperator || '');
      setEndDate(toDatePickerValue(editingRoll.endDate));
      setEndTime(editingRoll.endTime || '');
      setWeight(editingRoll.weight !== null && editingRoll.weight !== undefined ? String(editingRoll.weight) : '');
      setStatus(editingRoll.status || 'REGISTERED');
      setObservations(editingRoll.observations || '');
    } else {
      setRollNumber(suggestedRollNumber || '');
      setStartOperator('');
      setStartDate(getTodayLocalDate());
      setStartTime('');
      setEndOperator('');
      setEndDate(getTodayLocalDate());
      setEndTime('');
      setWeight('');
      setStatus('REGISTERED');
      setObservations('');
    }
    setError(null);
  }, [editingRoll, isOpen, suggestedRollNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rollNumber.trim()) {
      setError('El número de rollo es obligatorio (ej. 718, 719).');
      return;
    }

    try {
      setIsLoading(true);

      const payload: CreateRollDTO = {
        rollNumber: rollNumber.trim(),
        startOperator: startOperator.trim() || undefined,
        startDate: startDate.trim() || undefined,
        startTime: startTime.trim() || undefined,
        endOperator: endOperator.trim() || undefined,
        endDate: endDate.trim() || undefined,
        endTime: endTime.trim() || undefined,
        weight: weight.trim() !== '' ? parseFloat(weight) : undefined,
        status: editingRoll ? status : 'REGISTERED',
        observations: observations.trim() || undefined,
      };

      await onSave(payload, editingRoll?.id);
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar rollo:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      setError(apiError || 'Ocurrió un error al guardar los datos del rollo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRoll ? `Editar Rollo N° ${editingRoll.rollNumber}` : 'Registrar Nuevo Rollo'}
      description="Detalle de turno, horarios, operarios y peso del rollo de tela"
      icon={<Layers className="w-6 h-6 text-emerald-500" />}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {/* 1. N° Rollo, Peso y Estado (Estado solo al editar) */}
        <div className={`grid grid-cols-1 ${editingRoll ? 'sm:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              N° de Rollo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Ej. 718"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Peso (Kg)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Scale className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ej. 21.65"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          {editingRoll && (
            <div>
              <Select
                label="Estado del Rollo"
                leftIcon={<Activity className="w-4 h-4 text-slate-400" />}
                options={ROLL_STATUS_OPTIONS}
                value={status}
                onChange={(val) => setStatus(val as RollStatus)}
                placeholder="Estado..."
              />
            </div>
          )}
        </div>

        {/* 2. Sección Inicio (Operario -> Fecha -> Hora) */}
        <div className="relative z-30 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            1. Inicio del Rollo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Operario Inicio */}
            <div>
              <Select
                label="Operario Inicio"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                options={operatorOptions}
                value={startOperator}
                onChange={setStartOperator}
                placeholder="Seleccionar operario..."
              />
            </div>

            {/* 2. Fecha Inicio */}
            <div>
              <DatePicker
                label="Fecha Inicio"
                value={startDate}
                onChange={setStartDate}
                placeholder="Seleccionar fecha..."
              />
            </div>

            {/* 3. Hora Inicio */}
            <div>
              <TimePicker
                label="Hora Inicio"
                value={startTime}
                onChange={setStartTime}
                placeholder="HH:MM"
                align="right"
              />
            </div>
          </div>
        </div>

        {/* 3. Sección Término (Operario -> Fecha -> Hora) */}
        <div className="relative z-20 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            2. Término / Entrega del Rollo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Operario Término */}
            <div>
              <Select
                label="Operario Término"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                options={operatorOptions}
                value={endOperator}
                onChange={setEndOperator}
                placeholder="Seleccionar operario..."
              />
            </div>

            {/* 2. Fecha Término */}
            <div>
              <DatePicker
                label="Fecha Término"
                value={endDate}
                onChange={setEndDate}
                placeholder="Seleccionar fecha..."
              />
            </div>

            {/* 3. Hora Término */}
            <div>
              <TimePicker
                label="Hora Término"
                value={endTime}
                onChange={setEndTime}
                placeholder="HH:MM"
                align="right"
              />
            </div>
          </div>
        </div>

        {/* 4. Observaciones */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observaciones / Incidencias de Calidad
          </label>
          <input
            type="text"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ej. caída - cabeza, Despacho SANDRO 213.55, corte, etc."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Guardando...' : editingRoll ? 'Guardar Cambios' : 'Registrar Rollo'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
