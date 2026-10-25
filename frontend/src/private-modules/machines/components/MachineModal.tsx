import React, { useState, useEffect } from 'react';
import {
  Cog,
  Save,
  Tag,
  Barcode,
  Layers,
  MapPin,
  FileText,
  Activity,
  Loader2,
} from 'lucide-react';
import type { Machine, CreateMachineDTO, UpdateMachineDTO, MachineStatus } from '../types/machines.types';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { Select, type SelectOption } from '../../../shared/ui/Select';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateMachineDTO | UpdateMachineDTO, id?: string) => Promise<void>;
  editingMachine?: Machine | null;
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'Costura', label: 'Costura' },
  { value: 'Corte', label: 'Corte' },
  { value: 'Tejido', label: 'Tejido' },
  { value: 'Estampado', label: 'Estampado' },
  { value: 'Bordado', label: 'Bordado' },
  { value: 'Planchado', label: 'Planchado' },
  { value: 'Acabado', label: 'Acabado' },
  { value: 'Tintorería', label: 'Tintorería' },
  { value: 'Otro', label: 'Otro' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'OPERATIVE', label: 'Operativa (En funcionamiento)' },
  { value: 'MAINTENANCE', label: 'En Mantenimiento (Servicio técnico / Calibración)' },
  { value: 'OUT_OF_SERVICE', label: 'Fuera de Servicio (Inactiva / Requiere repuesto)' },
];

export const MachineModal: React.FC<MachineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMachine,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Costura');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [designTypes, setDesignTypes] = useState('');
  const [status, setStatus] = useState<MachineStatus>('OPERATIVE');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingMachine) {
      setCode(editingMachine.code || '');
      setName(editingMachine.name || '');
      setType(editingMachine.type || 'Costura');
      setBrand(editingMachine.brand || '');
      setModel(editingMachine.model || '');
      setSerialNumber(editingMachine.serialNumber || '');
      setDesignTypes(
        Array.isArray(editingMachine.designTypes)
          ? editingMachine.designTypes.join(', ')
          : (editingMachine.designTypes as string) || ''
      );
      setStatus(editingMachine.status || 'OPERATIVE');
      setLocation(editingMachine.location || '');
      setNotes(editingMachine.notes || '');
    } else {
      setCode('');
      setName('');
      setType('Costura');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setDesignTypes('');
      setStatus('OPERATIVE');
      setLocation('');
      setNotes('');
    }
    setError(null);
  }, [editingMachine, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('El código de identificación de la máquina es obligatorio.');
      return;
    }

    if (!name.trim()) {
      setError('El nombre o descripción de la máquina es obligatorio.');
      return;
    }

    try {
      setIsLoading(true);

      const payload: CreateMachineDTO = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type: type.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        designTypes: designTypes.trim() || undefined,
        status,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSave(payload, editingMachine?.id);
      if (!editingMachine) {
        setCode('');
        setName('');
        setType('Costura');
        setBrand('');
        setModel('');
        setSerialNumber('');
        setStatus('OPERATIVE');
        setLocation('');
        setNotes('');
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar máquina:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      setError(apiError || 'Ocurrió un error al guardar los datos de la máquina. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMachine ? 'Editar Máquina' : 'Nueva Máquina'}
      description={
        editingMachine
          ? `Modifica la información y estado de la máquina [${editingMachine.code}]`
          : 'Ingresa los datos técnicos y ubicación para añadir la máquina al inventario'
      }
      icon={<Cog className="w-6 h-6 text-primary-500" />}
      size="lg"
      isLoading={isLoading}
      loadingMessage={editingMachine ? 'Actualizando datos de la máquina...' : 'Registrando nueva máquina...'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {/* 1. Código y Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Código de Máquina <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. MQ-001, TEL-02"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Identificador único en planta</p>
          </div>

          <div>
            <Select
              label="Tipo / Proceso *"
              leftIcon={<Layers className="w-4 h-4 text-slate-400" />}
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
              placeholder="Selecciona el proceso textil..."
            />
          </div>
        </div>

        {/* 2. Nombre / Descripción */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Nombre / Descripción de la Máquina <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Remalladora 5 hilos mecatrónica, Tejedora Circular"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        {/* 3. Marca, Modelo y Serie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Marca
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej. Juki, Brother, Jack"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Modelo
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ej. MO-6814S"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              N° de Serie
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Ej. SN-4910283"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
            />
          </div>
        </div>

        {/* 4. Estado Operativo */}
        <div>
          <Select
            label="Estado Operativo *"
            leftIcon={<Activity className="w-4 h-4 text-slate-400" />}
            options={STATUS_OPTIONS}
            value={status}
            onChange={(val) => setStatus(val as MachineStatus)}
            placeholder="Selecciona el estado operativo..."
          />
        </div>

        {/* 5. Tipos de Diseño */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Tipos de Diseño (Separados por coma)
          </label>
          <input
            type="text"
            value={designTypes}
            onChange={(e) => setDesignTypes(e.target.value)}
            placeholder="Ej. Dray, Win, Jersey, Rib"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        {/* 6. Ubicación / Área */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Ubicación / Área de Planta
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej. Línea de Costura 1, Área de Corte, Taller Central"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        {/* 6. Observaciones / Notas */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observaciones / Notas de Mantenimiento
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles sobre accesorios, calibración de aguja o fecha estimada de mantenimiento..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
            className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isLoading ? (editingMachine ? 'Actualizando...' : 'Creando...') : editingMachine ? 'Guardar Cambios' : 'Crear Máquina'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
