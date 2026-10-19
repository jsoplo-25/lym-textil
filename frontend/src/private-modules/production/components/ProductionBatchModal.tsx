import React, { useState, useEffect } from 'react';
import { Factory, Save, Hash, Cog, FileText, Activity, Truck, Loader2 } from 'lucide-react';
import type { ProductionBatch, CreateBatchDTO, UpdateBatchDTO, BatchStatus } from '../types/production.types';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { DatePicker } from '../../../shared/ui/DatePicker';
import { machinesService } from '../../machines/services/machines.service';
import { suppliersService } from '../../suppliers/services/suppliers.service';
import { getTodayLocalDate, toDatePickerValue } from '../../../shared/lib/utils';

interface ProductionBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateBatchDTO | UpdateBatchDTO, id?: string) => Promise<void>;
  editingBatch?: ProductionBatch | null;
}

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'REQUESTED', label: '1. Solicitud registrada' },
  { value: 'COMPLETED', label: '2. Terminado' },
];

export const ProductionBatchModal: React.FC<ProductionBatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBatch,
}) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [machineId, setMachineId] = useState('');
  const [machineOptions, setMachineOptions] = useState<SelectOption[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<BatchStatus>('REQUESTED');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. Cargar máquinas
      machinesService
        .getMachines()
        .then((res) => {
          if (res && res.machines) {
            const options: SelectOption[] = [
              { value: '', label: 'Sin máquina asignada / Pendiente' },
              ...res.machines.map((m) => ({
                value: m.id,
                label: `[${m.code}] ${m.name} (${m.type})`,
              })),
            ];
            setMachineOptions(options);
          }
        })
        .catch(() => {});

      // 2. Cargar proveedores / clientes
      suppliersService
        .getSuppliers()
        .then((res) => {
          if (res && res.suppliers) {
            const options: SelectOption[] = [
              { value: '', label: 'Sin proveedor específico / General' },
              ...res.suppliers.map((s) => ({
                value: s.id,
                label: `[${s.document}] ${s.name}${s.yarnTypes ? ` (${s.yarnTypes})` : ''}`,
              })),
            ];
            setSupplierOptions(options);
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
      setNotes(editingBatch.notes || '');
    } else {
      setBatchNumber('');
      setMachineId('');
      setSupplierId('');
      setStartDate(getTodayLocalDate());
      setStatus('REQUESTED');
      setNotes('');
    }
    setError(null);
  }, [editingBatch, isOpen]);

  const statusOptions: SelectOption[] = editingBatch
    ? STATUS_OPTIONS
    : [{ value: 'REQUESTED', label: '1. Solicitud registrada' }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!batchNumber.trim()) {
      setError('El número o código de lote es obligatorio (ej. LOTE 12).');
      return;
    }

    if (status === 'COMPLETED') {
      if (!editingBatch) {
        setError('Un lote nuevo no puede crearse en estado Terminado porque aún no tiene rollos.');
        return;
      }
      if (editingBatch.rolls) {
        if (editingBatch.rolls.length === 0) {
          setError('No se puede marcar el lote como Terminado porque aún no tiene rollos registrados.');
          return;
        }
        const pendingRolls = editingBatch.rolls.filter((r) => r.status !== 'DELIVERED').length;
        if (pendingRolls > 0) {
          setError(
            `No se puede marcar el lote como Terminado porque tiene ${pendingRolls} ${
              pendingRolls === 1 ? 'rollo pendiente' : 'rollos pendientes'
            } de entrega (todos los rollos deben estar en estado "Entregado").`
          );
          return;
        }
      }
    }

    try {
      setIsLoading(true);

      const payload: CreateBatchDTO = {
        batchNumber: batchNumber.trim().toUpperCase(),
        machineId: machineId || undefined,
        supplierId: supplierId || undefined,
        startDate: startDate ? `${startDate}T12:00:00.000Z` : undefined,
        status,
        notes: notes.trim() || undefined,
      };

      await onSave(payload, editingBatch?.id);
      if (!editingBatch) {
        setBatchNumber('');
        setMachineId('');
        setSupplierId('');
        setStartDate(getTodayLocalDate());
        setStatus('REQUESTED');
        setNotes('');
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar lote:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      setError(apiError || 'Ocurrió un error al guardar el lote de producción.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBatch ? 'Editar Lote' : 'Nuevo Lote'}
      description={
        editingBatch
          ? `Actualiza la cabecera, proveedor y máquina del lote [${editingBatch.batchNumber}]`
          : 'Crea una nueva orden/lote para registrar la sábana de rollos'
      }
      icon={<Factory className="w-6 h-6 text-emerald-500" />}
      size="lg"
      isLoading={isLoading}
      loadingMessage={editingBatch ? 'Actualizando lote de producción...' : 'Creando lote de producción...'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {/* 1. N° de Lote y Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              N° o Identificador de Lote <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Ej. LOTE 12, LT-2025-01"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <Select
              label="Proveedor / Cliente de Hilado"
              leftIcon={<Truck className="w-4 h-4 text-slate-400" />}
              options={supplierOptions}
              value={supplierId}
              onChange={setSupplierId}
              disabled={Boolean(editingBatch)}
              placeholder="Selecciona proveedor..."
            />
            {editingBatch && (
              <p className="text-[11px] text-slate-400 mt-1">El proveedor ya fue asignado al crearse el lote.</p>
            )}
          </div>
        </div>

        {/* 2. Máquina Asignada */}
        <div>
          <Select
            label="Máquina de Producción"
            leftIcon={<Cog className="w-4 h-4 text-slate-400" />}
            options={machineOptions}
            value={machineId}
            onChange={setMachineId}
            placeholder="Selecciona la máquina..."
          />
        </div>

        {/* 3. Fecha de Inicio y Estado de la orden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DatePicker
              label="Fecha de Inicio"
              value={startDate}
              onChange={setStartDate}
              placeholder="Selecciona fecha..."
            />
          </div>

          <div>
            <Select
              label="Estado del Producto / Lote *"
              leftIcon={<Activity className="w-4 h-4 text-slate-400" />}
              options={statusOptions}
              value={status}
              onChange={(val) => setStatus(val as BatchStatus)}
              placeholder="Selecciona estado..."
            />
          </div>
        </div>

        {/* 4. Observaciones / Despacho */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notas / Especificaciones de Hilos o Despacho
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Despacho INLET, 10 rollos 3 gotas, partida de hilos #4592..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isLoading ? (editingBatch ? 'Actualizando...' : 'Creando...') : editingBatch ? 'Guardar Cambios' : 'Crear Lote'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
