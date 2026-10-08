import React, { useState, useEffect } from 'react';
import { Layers, Save, Tag, Hash, FileText, Activity, Scale } from 'lucide-react';
import type { BatchYarn, CreateYarnDTO, UpdateYarnDTO, YarnStatus } from '../types/production.types';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { Select, type SelectOption } from '../../../shared/ui/Select';

interface YarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateYarnDTO | UpdateYarnDTO, id?: string) => Promise<void>;
  editingYarn?: BatchYarn | null;
  supplierYarnTypes?: string | null;
}

export const YARN_STATUS_OPTIONS: SelectOption[] = [
  { value: 'IN_PREPARATION', label: '1. En preparación' },
  { value: 'READY_FOR_PICKUP', label: '2. Listo para recojo' },
  { value: 'DELIVERED', label: '3. Entregado' },
];

export const YarnModal: React.FC<YarnModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingYarn,
  supplierYarnTypes,
}) => {
  const [yarnName, setYarnName] = useState('');
  const [color, setColor] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [rollCount, setRollCount] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [status, setStatus] = useState<YarnStatus>('IN_PREPARATION');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse supplier suggested yarn types (comma separated)
  const suggestedTypes = supplierYarnTypes
    ? supplierYarnTypes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  useEffect(() => {
    if (editingYarn) {
      setYarnName(editingYarn.yarnName || '');
      setColor(editingYarn.color || '');
      setLotCode(editingYarn.lotCode || '');
      setRollCount(
        editingYarn.rollCount !== null && editingYarn.rollCount !== undefined ? String(editingYarn.rollCount) : ''
      );
      setTotalWeight(
        editingYarn.totalWeight !== null && editingYarn.totalWeight !== undefined ? String(editingYarn.totalWeight) : ''
      );
      setStatus(editingYarn.status || 'IN_PREPARATION');
      setNotes(editingYarn.notes || '');
    } else {
      setYarnName('');
      setColor('');
      setLotCode('');
      setRollCount('');
      setTotalWeight('');
      setStatus('IN_PREPARATION');
      setNotes('');
    }
    setError(null);
  }, [editingYarn, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!yarnName.trim()) {
      setError('El tipo o nombre de hilo es obligatorio (ej. Algodón 30/1).');
      return;
    }

    try {
      setIsLoading(true);

      const payload: CreateYarnDTO = {
        yarnName: yarnName.trim(),
        color: color.trim() || undefined,
        lotCode: lotCode.trim() || undefined,
        rollCount: rollCount.trim() !== '' ? parseInt(rollCount, 10) : undefined,
        totalWeight: totalWeight.trim() !== '' ? parseFloat(totalWeight) : undefined,
        status,
        notes: notes.trim() || undefined,
      };

      await onSave(payload, editingYarn?.id);
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar hilo:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      setError(apiError || 'Ocurrió un error al guardar los datos del hilo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingYarn ? `Editar Hilo: ${editingYarn.yarnName}` : 'Registrar Hilo en Producción'}
      description="Control semanal y avance de producción por tipo de hilado"
      icon={<Layers className="w-6 h-6 text-emerald-500" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {/* 1. Nombre / Tipo de Hilo */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Tipo o Nombre de Hilo <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={yarnName}
              onChange={(e) => setYarnName(e.target.value)}
              placeholder="Ej. Algodón 30/1, Poliéster 24/1 Melange"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Sugerencias del proveedor */}
          {suggestedTypes.length > 0 && !editingYarn && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-slate-400">Suministrados por proveedor:</span>
              {suggestedTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setYarnName(type)}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Color y Partida / Lote */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Color / Tono
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ej. Crudo, Blanco, Melange"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Partida / Lote de Hilo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={lotCode}
                onChange={(e) => setLotCode(e.target.value)}
                placeholder="Ej. Partida #4592, L-01"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3. Rollos, Kilos y Estado del Hilo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Rollos Fabricados
            </label>
            <input
              type="number"
              min="0"
              value={rollCount}
              onChange={(e) => setRollCount(e.target.value)}
              placeholder="Ej. 10"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Peso Total (Kg)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Scale className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                placeholder="215.00"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <Select
              label="Estado del Hilo *"
              leftIcon={<Activity className="w-4 h-4 text-slate-400" />}
              options={YARN_STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as YarnStatus)}
              placeholder="Estado..."
            />
          </div>
        </div>

        {/* 4. Avance semanal / Notas */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Reporte de Avance Semanal / Notas para el Proveedor
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Semana 40: 10 rollos terminados. Se notificó al proveedor para recojo parcial..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Guardando...' : editingYarn ? 'Guardar Cambios' : 'Registrar Hilo'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
