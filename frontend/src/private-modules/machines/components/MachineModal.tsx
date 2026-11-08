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
  AlertCircle,
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
  existingMachines?: Machine[];
}

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'Tejido', label: 'Tejido' },
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
  existingMachines = [],
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Tejido');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [designTypes, setDesignTypes] = useState('');
  const [status, setStatus] = useState<MachineStatus>('OPERATIVE');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMachine) {
      setCode(editingMachine.code || '');
      setName(editingMachine.name || '');
      setType('Tejido');
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
      setType('Tejido');
      setBrand('');
      setModel('');
      setSerialNumber('');
      setDesignTypes('');
      setStatus('OPERATIVE');
      setLocation('');
      setNotes('');
    }
    setError(null);
    setFieldErrors({});
  }, [editingMachine, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanSerial = serialNumber.trim().toUpperCase();

    // 1. Validación de Código (Requerido)
    if (!cleanCode) {
      errors.code = 'El código de identificación es obligatorio.';
    } else if (cleanCode.length < 2) {
      errors.code = 'El código debe tener al menos 2 caracteres.';
    } else {
      // 2. Validación de Duplicados en Código
      const isDuplicateCode = existingMachines.some(
        (m) => m.code.toUpperCase() === cleanCode && m.id !== editingMachine?.id
      );
      if (isDuplicateCode) {
        errors.code = `Ya existe una máquina registrada con el código "${cleanCode}".`;
      }
    }

    // 3. Validación de Nombre / Descripción (Requerido)
    if (!cleanName) {
      errors.name = 'El nombre o descripción de la máquina es obligatorio.';
    } else if (cleanName.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres.';
    }

    // 4. Validación de Tipo / Proceso (Requerido)
    if (!type.trim()) {
      errors.type = 'Debes seleccionar un proceso textil.';
    }

    // 5. Validación de Duplicados en N° de Serie (si se proporciona)
    if (cleanSerial) {
      const isDuplicateSerial = existingMachines.some(
        (m) =>
          m.serialNumber &&
          m.serialNumber.trim().toUpperCase() === cleanSerial &&
          m.id !== editingMachine?.id
      );
      if (isDuplicateSerial) {
        errors.serialNumber = `Este N° de serie ya está registrado en otra máquina del sistema.`;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor revisa los campos señalados antes de continuar.');
      return false;
    }

    return true;
  };

  const handleCodeChange = (val: string) => {
    const upper = val.toUpperCase();
    setCode(upper);
    if (fieldErrors.code) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.code;
        return copy;
      });
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (fieldErrors.name) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
  };

  const handleSerialChange = (val: string) => {
    setSerialNumber(val);
    if (fieldErrors.serialNumber) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.serialNumber;
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
        setType('Tejido');
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

      // Si el backend reporta duplicado, asignarlo también al campo correspondiente
      if (apiError && apiError.toLowerCase().includes('código')) {
        setFieldErrors((prev) => ({ ...prev, code: apiError }));
      } else if (apiError && (apiError.toLowerCase().includes('serie') || apiError.toLowerCase().includes('serial'))) {
        setFieldErrors((prev) => ({ ...prev, serialNumber: apiError }));
      }

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
      className="max-h-[calc(100dvh-2rem)] flex flex-col"
      contentClassName="min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Código de Máquina <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Barcode className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Ej. MQ-001, TEL-02"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-semibold transition-all font-mono ${
                  fieldErrors.code
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
            </div>
            {fieldErrors.code ? (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.code}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Identificador único en planta (no duplicable)</p>
            )}
          </div>

          <div>
            <Select
              label="Tipo / Proceso *"
              leftIcon={<Layers className="w-4 h-4 text-slate-400" />}
              options={TYPE_OPTIONS}
              value={type}
              onChange={(val) => {
                setType(val);
                if (fieldErrors.type) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.type;
                    return copy;
                  });
                }
              }}
              placeholder="Selecciona el proceso textil..."
            />
            {fieldErrors.type && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.type}</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. Nombre / Descripción */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nombre / Descripción de la Máquina <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Remalladora 5 hilos mecatrónica, Tejedora Circular"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-semibold transition-all ${
                fieldErrors.name
                  ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
          </div>
          {fieldErrors.name ? (
            <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.name}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">Descripción técnica o denominación operativa</p>
          )}
        </div>

        {/* 3. Marca, Modelo y Serie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              N° de Serie
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => handleSerialChange(e.target.value)}
              placeholder="Ej. SN-4910283"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm transition-all font-mono ${
                fieldErrors.serialNumber
                  ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
            {fieldErrors.serialNumber && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.serialNumber}</span>
              </p>
            )}
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
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
            className="px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isLoading ? (editingMachine ? 'Actualizando...' : 'Creando...') : editingMachine ? 'Guardar Cambios' : 'Crear Máquina'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
