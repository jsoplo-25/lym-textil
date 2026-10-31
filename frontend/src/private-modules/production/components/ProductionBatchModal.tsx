import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { DatePicker } from '../../../shared/ui/DatePicker';
import type {
  ProductionBatch,
  CreateBatchDTO,
  BatchStatus,
} from '../types/production.types';
import { machinesService } from '../../machines/services/machines.service';
import { suppliersService } from '../../suppliers/services/suppliers.service';
import { Layers, Activity, FileText, Cog, Truck, AlertTriangle, AlertCircle } from 'lucide-react';
import { getTodayLocalDate, toDatePickerValue } from '../../../shared/lib/utils';

interface ProductionBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBatchDTO, id?: string) => Promise<void>;
  editingBatch?: ProductionBatch | null;
  existingBatches?: ProductionBatch[];
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'REQUESTED', label: '1. Solicitado / Solicitud registrada' },
  { value: 'IN_PROGRESS', label: '2. En Proceso (Producción en máquina)' },
  { value: 'PAUSED', label: '3. Pausado (Bloquea rollos temporalmente)' },
  { value: 'COMPLETED', label: '4. Terminado (Todos los rollos entregados)' },
];

export const ProductionBatchModal: React.FC<ProductionBatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBatch,
  existingBatches = [],
}) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [machineId, setMachineId] = useState('');
  const [machineOptions, setMachineOptions] = useState<SelectOption[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<BatchStatus>('REQUESTED');
  const [statusNote, setStatusNote] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // 1. Cargar máquinas
      machinesService
        .getMachines()
        .then((res) => {
          if (res && res.machines) {
            const options: SelectOption[] = res.machines.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.type})`,
            }));
            setMachineOptions(options);
            if (!editingBatch && options.length > 0 && !machineId) {
              setMachineId(options[0].value);
            }
          }
        })
        .catch(() => {});

      // 2. Cargar proveedores / clientes
      suppliersService
        .getSuppliers()
        .then((res) => {
          if (res && res.suppliers) {
            const options: SelectOption[] = res.suppliers.map((s) => ({
              value: s.id,
              label: `[${s.document}] ${s.name}${s.yarnTypes ? ` (${Array.isArray(s.yarnTypes) ? s.yarnTypes.join(', ') : s.yarnTypes})` : ''}`,
            }));
            setSupplierOptions(options);
            if (!editingBatch && options.length > 0 && !supplierId) {
              setSupplierId(options[0].value);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingBatch) {
      setBatchNumber(editingBatch.batchNumber || '');
      setMachineId(editingBatch.machineId || '');
      setSupplierId(editingBatch.supplierId || '');
      setStartDate(
        editingBatch.startDate
          ? toDatePickerValue(editingBatch.startDate)
          : getTodayLocalDate()
      );
      setStatus(editingBatch.status || 'REQUESTED');
      setStatusNote('');
      setNotes(editingBatch.notes || '');
    } else {
      setBatchNumber('');
      setStartDate(getTodayLocalDate());
      setStatus('REQUESTED');
      setStatusNote('');
      setNotes('');
    }
    setError(null);
    setFieldErrors({});
  }, [editingBatch, isOpen]);

  const statusOptions: SelectOption[] = editingBatch
    ? STATUS_OPTIONS
    : [
        { value: 'REQUESTED', label: '1. Solicitado / Solicitud registrada' },
        { value: 'IN_PROGRESS', label: '2. En Proceso (Producción en máquina)' },
        { value: 'PAUSED', label: '3. Pausado' },
      ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanBatch = batchNumber.trim().toUpperCase();

    // 1. Identificador de Lote Requerido
    if (!cleanBatch) {
      errors.batchNumber = 'El código o número de lote es obligatorio (ej. LOTE 12).';
    } else if (cleanBatch.length < 2) {
      errors.batchNumber = 'El código de lote debe tener al menos 2 caracteres.';
    } else {
      // 2. Duplicados de Lote
      const isDuplicate = existingBatches.some(
        (b) => b.batchNumber.toUpperCase() === cleanBatch && b.id !== editingBatch?.id
      );
      if (isDuplicate) {
        errors.batchNumber = `Ya existe un lote registrado con el identificador "${cleanBatch}".`;
      }
    }

    // 3. Proveedor / Cliente requerido
    if (!supplierId.trim()) {
      errors.supplierId = 'Debes seleccionar el proveedor / cliente del hilado.';
    }

    // 4. Máquina de Producción requerida
    if (!machineId.trim()) {
      errors.machineId = 'Debes asignar la máquina de tejeduría.';
    }

    // 5. Fecha de Inicio requerida
    if (!startDate.trim()) {
      errors.startDate = 'La fecha de inicio de producción es obligatoria.';
    }

    // 6. Motivo de pausa si aplica
    if (status === 'PAUSED' && editingBatch?.status !== 'PAUSED' && !statusNote.trim()) {
      errors.statusNote = 'Debes especificar el motivo de pausar el lote.';
    }

    if (status === 'COMPLETED') {
      if (!editingBatch) {
        errors.status = 'Un lote nuevo no puede crearse en estado Terminado porque aún no tiene rollos.';
      } else if (editingBatch.rolls) {
        if (editingBatch.rolls.length === 0) {
          errors.status = 'No se puede marcar el lote como Terminado porque no tiene rollos registrados.';
        } else {
          const pendingRolls = editingBatch.rolls.filter((r) => r.status !== 'DELIVERED').length;
          if (pendingRolls > 0) {
            errors.status = `Tiene ${pendingRolls} rollo(s) pendiente(s) de entrega (todos deben estar Entregados).`;
          }
        }
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor corrige los campos señalados antes de guardar.');
      return false;
    }

    return true;
  };

  const handleBatchNumberChange = (val: string) => {
    setBatchNumber(val);
    if (fieldErrors.batchNumber) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.batchNumber;
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

      const payload: CreateBatchDTO = {
        batchNumber: batchNumber.trim().toUpperCase(),
        machineId: machineId.trim(),
        supplierId: supplierId.trim(),
        startDate: `${startDate}T12:00:00.000Z`,
        status,
        statusNote: statusNote.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSave(payload, editingBatch?.id);
      if (!editingBatch) {
        setBatchNumber('');
        setStartDate(getTodayLocalDate());
        setStatus('REQUESTED');
        setStatusNote('');
        setNotes('');
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar lote:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (apiError && apiError.toLowerCase().includes('lote')) {
        setFieldErrors((prev) => ({ ...prev, batchNumber: apiError }));
      }

      setError(apiError || 'Ocurrió un error al guardar el lote de producción.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBatch ? `Editar Lote [${editingBatch.batchNumber}]` : 'Nuevo Lote de Producción'}
      description="Identificador único, proveedor/cliente, máquina y orden de producción"
      icon={<Layers className="w-6 h-6 text-primary-500" />}
      size="xl"
      className="max-h-[calc(100dvh-2rem)] flex flex-col"
      contentClassName="min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2"
      isLoading={isLoading}
      loadingMessage={editingBatch ? 'Actualizando datos del lote...' : 'Registrando lote de producción...'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {status === 'PAUSED' && (
          <Alert variant="warning" title="Estado Pausado">
            Al pausar el lote, se bloqueará la adición, edición y eliminación de rollos hasta que sea reactivado.
          </Alert>
        )}

        {/* 1. N° Lote y Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Identificador de Lote <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => handleBatchNumberChange(e.target.value)}
                placeholder="Ej. LOTE 15 o CU-001"
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-bold transition-all font-mono uppercase ${
                  fieldErrors.batchNumber
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
            </div>
            {fieldErrors.batchNumber ? (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.batchNumber}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Código único de orden o partida</p>
            )}
          </div>

          <div>
            <Select
              label="Proveedor / Cliente de Hilado *"
              leftIcon={<Truck className="w-4 h-4 text-slate-400" />}
              options={supplierOptions}
              value={supplierId}
              onChange={(val) => {
                setSupplierId(val);
                if (fieldErrors.supplierId) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.supplierId;
                    return copy;
                  });
                }
              }}
              disabled={Boolean(editingBatch)}
              placeholder="Selecciona proveedor..."
            />
            {fieldErrors.supplierId && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.supplierId}</span>
              </p>
            )}
            {editingBatch && (
              <p className="text-[11px] text-slate-400 mt-1">El proveedor ya fue asignado al crearse el lote.</p>
            )}
          </div>
        </div>

        {/* 2. Máquina Asignada */}
        <div>
          <Select
            label="Máquina de Producción *"
            leftIcon={<Cog className="w-4 h-4 text-slate-400" />}
            options={machineOptions}
            value={machineId}
            onChange={(val) => {
              setMachineId(val);
              if (fieldErrors.machineId) {
                setFieldErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.machineId;
                  return copy;
                });
              }
            }}
            placeholder="Selecciona la máquina..."
          />
          {fieldErrors.machineId && (
            <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.machineId}</span>
            </p>
          )}
        </div>

        {/* 3. Fecha de Inicio y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DatePicker
              label="Fecha de Inicio *"
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
              placeholder="Selecciona fecha..."
            />
            {fieldErrors.startDate && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.startDate}</span>
              </p>
            )}
          </div>

          <div>
            <Select
              label="Estado del Producto / Lote *"
              leftIcon={<Activity className="w-4 h-4 text-slate-400" />}
              options={statusOptions}
              value={status}
              onChange={(val: string) => setStatus(val as BatchStatus)}
              placeholder="Selecciona estado..."
            />
          </div>
        </div>

        {/* Campo condicional: Motivo de pausa */}
        {status === 'PAUSED' && (
          <div>
            <label className="block text-xs font-semibold text-accent-600 dark:text-accent-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Motivo u Observación de la Pausa *
            </label>
            <input
              type="text"
              required
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Ej. Esperando partida de hilo azul del proveedor, calibración de agujas..."
              className="w-full px-3.5 py-2.5 bg-accent-50/50 dark:bg-accent-950/20 border border-accent-300 dark:border-accent-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-accent-700/50 dark:placeholder-accent-400/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
            />
          </div>
        )}

        {/* 4. Observaciones / Especificaciones */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notas / Especificaciones
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Despacho INLET, 10 rollos 3 gotas, partida de hilos #4592..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white text-sm font-bold shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 transition-all disabled:opacity-60"
          >
            {isLoading ? 'Guardando...' : editingBatch ? 'Actualizar Lote' : 'Crear Lote'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
