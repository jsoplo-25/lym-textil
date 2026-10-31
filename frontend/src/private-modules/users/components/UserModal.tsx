import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Lock, Mail, User, Shield, Eye, EyeOff, Phone, Briefcase, FileText, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import type { ManagedUser, CreateUserDTO, UpdateUserDTO, UserStatus, PeruDocumentType } from '../types/users.types';
import type { UserProfile } from '../../../entities/session/sessionTypes';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';
import { rolesService } from '../../roles/services/roles.service';
import type { RoleDefinition } from '../../roles/types/roles.types';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
];

const DOCUMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'DNI', label: 'DNI - Doc. Nacional de Identidad' },
  { value: 'CE', label: 'CE - Carné de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'RUC', label: 'RUC - Persona Natural' },
];

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserDTO | UpdateUserDTO, id?: string) => Promise<void>;
  editingUser?: ManagedUser | null;
  availableRoles?: RoleDefinition[];
  existingUsers?: ManagedUser[];
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  availableRoles,
  existingUsers = [],
}) => {
  const [documentType, setDocumentType] = useState<PeruDocumentType>('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserProfile['role']>('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
  const [rawRoles, setRawRoles] = useState<RoleDefinition[]>(availableRoles || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (availableRoles && availableRoles.length > 0) {
      setRawRoles(availableRoles);
      setRoleOptions(
        availableRoles.map((r) => ({
          value: r.code,
          label: r.name,
        }))
      );
    } else if (isOpen) {
      rolesService
        .getRoles()
        .then((roles) => {
          if (roles && roles.length > 0) {
            setRawRoles(roles);
            setRoleOptions(
              roles.map((r) => ({
                value: r.code,
                label: r.name,
              }))
            );
          }
        })
        .catch(() => { });
    }
  }, [availableRoles, isOpen]);

  useEffect(() => {
    if (editingUser) {
      const matched = rawRoles.find((r) => r.code === editingUser.role || r.id === editingUser.role);
      setDocumentType((editingUser.documentType as PeruDocumentType) || 'DNI');
      setDocumentNumber(editingUser.documentNumber || '');
      setFirstName(editingUser.firstName);
      setLastName(editingUser.lastName);
      setEmail(editingUser.email);
      setPhone(editingUser.phone || '');
      setJobTitle(editingUser.jobTitle || matched?.description || '');
      setPassword('');
      setRole(editingUser.role);
      setAvatarUrl(editingUser.avatarUrl || '');
      setStatus(editingUser.status || 'ACTIVE');
    } else {
      const defaultRole = availableRoles?.[0]?.code || roleOptions?.[0]?.value || '';
      const matched = rawRoles.find((r) => r.code === defaultRole || r.id === defaultRole);
      setDocumentType('DNI');
      setDocumentNumber('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setJobTitle(matched?.description || '');
      setPassword('');
      setShowPassword(false);
      setRole(defaultRole as UserProfile['role']);
      setAvatarUrl('');
      setStatus('ACTIVE');
    }
    setError(null);
    setFieldErrors({});
  }, [editingUser, isOpen, availableRoles, roleOptions, rawRoles]);

  const handleRoleChange = (newRoleVal: string) => {
    const selectedRole = newRoleVal as UserProfile['role'];
    setRole(selectedRole);
    if (fieldErrors.role) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.role;
        return copy;
      });
    }
    const matched = rawRoles.find((r) => r.code === selectedRole || r.id === selectedRole);
    if (matched?.description) {
      setJobTitle(matched.description);
    }
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (documentType === 'DNI' || documentType === 'RUC') {
      setDocumentNumber(val.replace(/\D/g, ''));
    } else {
      setDocumentNumber(val.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    }
    if (fieldErrors.documentNumber) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.documentNumber;
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanDoc = documentNumber.trim();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Validación de documento peruano (si se ingresó)
    if (cleanDoc) {
      if (documentType === 'DNI' && !/^\d{8}$/.test(cleanDoc)) {
        errors.documentNumber = 'El DNI debe contener exactamente 8 dígitos numéricos.';
      } else if (documentType === 'RUC' && !/^\d{11}$/.test(cleanDoc)) {
        errors.documentNumber = 'El RUC debe contener exactamente 11 dígitos numéricos.';
      } else if (documentType === 'CE' && !/^[A-Za-z0-9]{8,12}$/.test(cleanDoc)) {
        errors.documentNumber = 'El Carné de Extranjería (CE) debe contener entre 8 y 12 caracteres.';
      } else if (documentType === 'PASAPORTE' && !/^[A-Za-z0-9]{6,12}$/.test(cleanDoc)) {
        errors.documentNumber = 'El Pasaporte debe contener entre 6 y 12 caracteres.';
      } else {
        // Verificar duplicados de documento
        const isDuplicateDoc = existingUsers.some(
          (u) => u.documentNumber && u.documentNumber.trim() === cleanDoc && u.id !== editingUser?.id
        );
        if (isDuplicateDoc) {
          errors.documentNumber = `Ya existe un usuario con el documento "${cleanDoc}".`;
        }
      }
    }

    // 2. Nombres requeridos
    if (!cleanFirstName) {
      errors.firstName = 'El nombre del usuario es obligatorio.';
    } else if (cleanFirstName.length < 2) {
      errors.firstName = 'El nombre debe tener al menos 2 caracteres.';
    }

    // 3. Apellidos requeridos
    if (!cleanLastName) {
      errors.lastName = 'El apellido del usuario es obligatorio.';
    } else if (cleanLastName.length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres.';
    }

    // 4. Correo electrónico requerido y formato
    if (!cleanEmail) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'El formato del correo electrónico no es válido.';
      } else {
        // Verificar duplicado de correo
        const isDuplicateEmail = existingUsers.some(
          (u) => u.email.toLowerCase() === cleanEmail && u.id !== editingUser?.id
        );
        if (isDuplicateEmail) {
          errors.email = `Ya existe un usuario con el correo "${cleanEmail}".`;
        }
      }
    }

    // 5. Rol requerido
    if (!role) {
      errors.role = 'Debes seleccionar un rol para el usuario.';
    }

    // 6. Contraseña para nuevos usuarios
    if (!editingUser) {
      if (!password) {
        errors.password = 'La contraseña es obligatoria para nuevos usuarios.';
      } else if (password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres.';
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Por favor revisa los campos señalados antes de continuar.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    const cleanDoc = documentNumber.trim();
    setIsLoading(true);

    try {
      if (editingUser) {
        await onSave(
          {
            documentType,
            documentNumber: cleanDoc || undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
            jobTitle: jobTitle.trim() || undefined,
            role,
            avatarUrl: avatarUrl || undefined,
            status,
          },
          editingUser.id
        );
      } else {
        await onSave({
          documentType,
          documentNumber: cleanDoc || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          password,
          role,
          status,
          avatarUrl: avatarUrl || undefined,
        });
      }
      if (!editingUser) {
        setDocumentType('DNI');
        setDocumentNumber('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setJobTitle('');
        setPassword('');
        setShowPassword(false);
        setAvatarUrl('');
        setStatus('ACTIVE');
      }
      onClose();
    } catch (err: unknown) {
      console.error('Error saving user:', err);
      const errorObj = err && typeof err === 'object' ? (err as { response?: { data?: { error?: string } }; message?: string }) : null;
      const apiError = errorObj?.response?.data?.error || errorObj?.message || 'Error al guardar usuario.';

      if (apiError.toLowerCase().includes('correo') || apiError.toLowerCase().includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: apiError }));
      } else if (apiError.toLowerCase().includes('documento')) {
        setFieldErrors((prev) => ({ ...prev, documentNumber: apiError }));
      }

      setError(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={editingUser ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
      title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      description={editingUser ? 'Modifica los datos y accesos del colaborador' : 'Registra un nuevo usuario en Textil L&M'}
      isLoading={isLoading}
      loadingMessage={editingUser ? 'Actualizando datos del usuario...' : 'Creando nuevo usuario...'}
    >
      {error && (
        <Alert variant="error" size="sm" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Documento de Identidad (Perú) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Tipo de Documento *
            </label>
            <Select
              options={DOCUMENT_TYPE_OPTIONS}
              value={documentType}
              onChange={(val) => {
                setDocumentType(val as PeruDocumentType);
                setDocumentNumber('');
                if (fieldErrors.documentNumber) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.documentNumber;
                    return copy;
                  });
                }
              }}
              leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>N° de Documento</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {documentType === 'DNI'
                  ? '8 dígitos'
                  : documentType === 'RUC'
                  ? '11 dígitos'
                  : '8-12 caracteres'}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={documentNumber}
                onChange={handleDocumentNumberChange}
                maxLength={documentType === 'DNI' ? 8 : documentType === 'RUC' ? 11 : 12}
                placeholder={
                  documentType === 'DNI'
                    ? 'Ej. 71234567'
                    : documentType === 'RUC'
                    ? 'Ej. 10712345678'
                    : 'Ej. 001234567'
                }
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white text-xs font-mono font-semibold focus:outline-none transition-all ${
                  fieldErrors.documentNumber
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'
                }`}
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
            {fieldErrors.documentNumber && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.documentNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Nombres *
            </label>
            <div className="relative">
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.firstName;
                      return copy;
                    });
                  }
                }}
                placeholder="Ej. Carlos"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white text-xs focus:outline-none transition-all ${
                  fieldErrors.firstName
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'
                }`}
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
            {fieldErrors.firstName && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.firstName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Apellidos *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (fieldErrors.lastName) {
                  setFieldErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.lastName;
                    return copy;
                  });
                }
              }}
              placeholder="Ej. Gomez"
              className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white text-xs focus:outline-none transition-all ${
                fieldErrors.lastName
                  ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'
              }`}
            />
            {fieldErrors.lastName && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.lastName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Correo y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Correo Electrónico *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.email;
                      return copy;
                    });
                  }
                }}
                placeholder="correo@textil-lym.com"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white text-xs focus:outline-none transition-all ${
                  fieldErrors.email
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Teléfono / WhatsApp
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 987654321"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Contraseña (solo si es nuevo) */}
        {!editingUser && (
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Contraseña de Acceso *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.password;
                      return copy;
                    });
                  }
                }}
                placeholder="Mínimo 6 caracteres"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white text-xs focus:outline-none transition-all ${
                  fieldErrors.password
                    ? 'border-rose-500 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>
        )}

        {/* Rol y Cargo (el cargo depende del rol) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Rol Operacional *
            </label>
            <Select
              options={roleOptions}
              value={role}
              onChange={handleRoleChange}
              placeholder="Seleccionar rol..."
              leftIcon={<Shield className="w-4 h-4 text-slate-400" />}
            />
            {fieldErrors.role && (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.role}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Cargo / Función</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={jobTitle}
                readOnly
                tabIndex={-1}
                placeholder="Se carga desde la descripción del rol..."
                title="Este campo está bloqueado porque se gestiona desde el módulo de Roles."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium cursor-not-allowed select-none focus:outline-none"
              />
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Estado (solo al editar; un usuario nuevo siempre se crea Activo) */}
        {editingUser && (
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Estado de la Cuenta *
            </label>
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as UserStatus)}
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-primary-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
