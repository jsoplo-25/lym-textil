import React, { useState, useEffect } from 'react';
import { Truck, Save, Building2, Phone, Mail, MapPin, Layers, FileText, Activity, Loader2, AlertCircle } from 'lucide-react';
import type { Supplier, CreateSupplierDTO, UpdateSupplierDTO, SupplierStatus } from '../types/suppliers.types';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { Select, type SelectOption } from '../../../shared/ui/Select';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSupplierDTO | UpdateSupplierDTO, id?: string) => Promise<void>;
  editingSupplier?: Supplier | null;
  existingSuppliers?: Supplier[];
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE', label: 'Activo / Operativo' },
  { value: 'INACTIVE', label: 'Inactivo / Suspendido' },
];

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSupplier,
  existingSuppliers = [],
}) => {
  const [document, setDocument] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [yarnTypes, setYarnTypes] = useState('');
  const [status, setStatus] = useState<SupplierStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingSupplier) {
      setDocument(editingSupplier.document || '');
      setName(editingSupplier.name || '');
      setPhone(editingSupplier.phone || '');
      setEmail(editingSupplier.email || '');
      setAddress(editingSupplier.address || '');
      setYarnTypes(
        Array.isArray(editingSupplier.yarnTypes)
          ? editingSupplier.yarnTypes.join(', ')
          : editingSupplier.yarnTypes || ''
      );
      setStatus(editingSupplier.status || 'ACTIVE');
      setNotes(editingSupplier.notes || '');
    } else {
      setDocument('');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setYarnTypes('');
      setStatus('ACTIVE');
      setNotes('');
    }
    setError(null);
    setFieldErrors({});
  }, [editingSupplier, isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanDoc = document.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Documento (RUC/DNI) requerido
    if (!cleanDoc) {
      errors.document = 'El RUC o documento del proveedor es obligatorio.';
    } else if (cleanDoc.length < 8) {
      errors.document = 'El documento debe tener al menos 8 dígitos (DNI) u 11 (RUC).';
    } else {
      // Duplicados de Documento
      const isDuplicateDoc = existingSuppliers.some(
        (s) => s.document.toUpperCase() === cleanDoc && s.id !== editingSupplier?.id
      );
      if (isDuplicateDoc) {
        errors.document = `Ya existe un proveedor registrado con el documento "${cleanDoc}".`;
      }
    }

    // 2. Razón Social requerida
    if (!cleanName) {
      errors.name = 'La Razón Social o nombre del proveedor es obligatorio.';
    } else if (cleanName.length < 3) {
      errors.name = 'El nombre del proveedor debe tener al menos 3 caracteres.';
    } else {
      // Duplicados de Razón Social
      const isDuplicateName = existingSuppliers.some(
        (s) => s.name.trim().toLowerCase() === cleanName.toLowerCase() && s.id !== editingSupplier?.id
      );
      if (isDuplicateName) {
        errors.name = `Ya existe un proveedor registrado con el nombre "${cleanName}".`;
      }
    }

    // 3. Formato de Email si se ingresó
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'El formato del correo electrónico es inválido.';
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor verifica los campos resaltados antes de guardar.');
      return false;
    }

    return true;
  };

  const handleDocumentChange = (val: string) => {
    setDocument(val);
    if (fieldErrors.document) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.document;
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

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.email;
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

      const payload: CreateSupplierDTO = {
        document: document.trim().toUpperCase(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        yarnTypes: yarnTypes.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      };

      await onSave(payload, editingSupplier?.id);
      if (!editingSupplier) {
        setDocument('');
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setYarnTypes('');
        setStatus('ACTIVE');
        setNotes('');
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error al guardar proveedor:', err);
      const apiError =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (apiError && (apiError.toLowerCase().includes('documento') || apiError.toLowerCase().includes('ruc'))) {
        setFieldErrors((prev) => ({ ...prev, document: apiError }));
      } else if (apiError && (apiError.toLowerCase().includes('razón social') || apiError.toLowerCase().includes('nombre'))) {
        setFieldErrors((prev) => ({ ...prev, name: apiError }));
      } else if (apiError && apiError.toLowerCase().includes('correo')) {
        setFieldErrors((prev) => ({ ...prev, email: apiError }));
      }

      setError(apiError || 'Ocurrió un error al guardar los datos del proveedor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      description={
        editingSupplier
          ? `Modifica los datos del proveedor [${editingSupplier.document} - ${editingSupplier.name}]`
          : 'Ingresa la información comercial y tipos de hilado que provee a la empresa'
      }
      icon={<Truck className="w-6 h-6 text-primary-500" />}
      size="lg"
      isLoading={isLoading}
      loadingMessage={editingSupplier ? 'Actualizando datos del proveedor...' : 'Creando nuevo proveedor...'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        )}

        {/* 1. Documento y Razón Social */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              RUC / Documento <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder="Ej. 20601234567"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-bold transition-all font-mono ${
                  fieldErrors.document
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
            </div>
            {fieldErrors.document ? (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.document}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Documento único de identificación fiscal</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Razón Social / Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. INLOTEX S.A.C., SANDRO TEXTIL"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-semibold transition-all ${
                fieldErrors.name
                  ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. Contacto: Teléfono y Correo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Teléfono / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +51 987 654 321"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="contacto@inlotex.com"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                fieldErrors.email ? 'border-rose-500 text-rose-900 dark:text-rose-200' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. Tipos de Hilado y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Tipos de Hilado Suministrados
            </label>
            <input
              type="text"
              value={yarnTypes}
              onChange={(e) => setYarnTypes(e.target.value)}
              placeholder="Ej. Algodón 30/1, Poliéster, Lycra, Viscosa"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <Select
              label="Estado del Proveedor *"
              leftIcon={<Activity className="w-4 h-4 text-slate-400" />}
              options={STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as SupplierStatus)}
              placeholder="Selecciona estado..."
            />
          </div>
        </div>

        {/* 4. Dirección / Planta */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Dirección / Planta / Almacén
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej. Av. Nicolás de Ayllón 1234, Ate, Lima"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        {/* 5. Notas Adicionales */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notas Comerciales / Especificaciones
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Cliente frecuente de servicio de tejeduría, despacho prioritario..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          />
        </div>

        {/* Footer */}
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
            <span>{isLoading ? (editingSupplier ? 'Actualizando...' : 'Creando...') : editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
