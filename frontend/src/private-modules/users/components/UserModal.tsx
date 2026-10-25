import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Lock, Mail, User, Shield, Eye, EyeOff, Phone, Briefcase, Hash, Loader2 } from 'lucide-react';
import type { ManagedUser, CreateUserDTO, UpdateUserDTO, UserStatus } from '../types/users.types';
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

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserDTO | UpdateUserDTO, id?: string) => Promise<void>;
  editingUser?: ManagedUser | null;
  availableRoles?: RoleDefinition[];
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  availableRoles,
}) => {
  const [workerId, setWorkerId] = useState('');
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
        .catch(() => {});
    }
  }, [availableRoles, isOpen]);

  useEffect(() => {
    if (editingUser) {
      const matched = rawRoles.find((r) => r.code === editingUser.role || r.id === editingUser.role);
      setWorkerId(editingUser.workerId || '');
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
      setWorkerId('');
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
  }, [editingUser, isOpen, availableRoles, roleOptions, rawRoles]);

  const handleRoleChange = (newRoleVal: string) => {
    const selectedRole = newRoleVal as UserProfile['role'];
    setRole(selectedRole);
    const matched = rawRoles.find((r) => r.code === selectedRole || r.id === selectedRole);
    if (matched?.description) {
      setJobTitle(matched.description);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingUser && !password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    if (!editingUser && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (editingUser) {
        await onSave(
          {
            workerId: workerId.trim() || undefined,
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
          workerId: workerId.trim() || undefined,
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
        setWorkerId('');
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
      const errorObj = err && typeof err === 'object' ? (err as { response?: { data?: { error?: string } }; message?: string }) : null;
      setError(errorObj?.response?.data?.error || errorObj?.message || 'Error al guardar usuario.');
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
        {/* ID Trabajador y Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              ID Trabajador (Opcional, autogenerado)
            </label>
            <div className="relative">
              <input
                type="text"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value.toUpperCase())}
                placeholder="Ej. USR-008"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none uppercase"
              />
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Cargo / Función</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Bloqueado (Desde Roles)
              </span>
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
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Ej. Carlos"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Apellidos *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Ej. Gomez"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
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
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="correo@textil-lym.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
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
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
          </div>
        )}

        {/* Rol y Estado */}
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
          </div>

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
        </div>

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
