import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Lock, Mail, User, Shield, Eye, EyeOff } from 'lucide-react';
import type { ManagedUser, CreateUserDTO, UpdateUserDTO } from '../types/users.types';
import type { UserProfile } from '../../../entities/session/sessionTypes';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { Avatar } from '../../../shared/ui/Avatar';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'ADMINISTRADOR', label: 'ADMINISTRADOR - Administrador General' },
  { value: 'OPERATOR', label: 'OPERATOR - Operario' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo / Suspendido' },
];

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserDTO | UpdateUserDTO, id?: string) => Promise<void>;
  editingUser?: ManagedUser | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserProfile['role']>('OPERATOR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setFirstName(editingUser.firstName);
      setLastName(editingUser.lastName);
      setEmail(editingUser.email);
      setPassword('');
      setRole(editingUser.role);
      setAvatarUrl(editingUser.avatarUrl || '');
      setStatus(editingUser.status || 'ACTIVE');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRole('OPERATOR');
      setAvatarUrl('');
      setStatus('ACTIVE');
    }
    setError(null);
  }, [editingUser, isOpen]);

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
            firstName,
            lastName,
            email,
            role,
            avatarUrl: avatarUrl || undefined,
            status,
          },
          editingUser.id
        );
      } else {
        await onSave({
          firstName,
          lastName,
          email,
          password,
          role,
          avatarUrl: avatarUrl || undefined,
        });
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
      description={editingUser ? 'Modifica los accesos del colaborador' : 'Registra un nuevo usuario en Textil L&M'}
    >
        {error && (
          <Alert variant="error" size="sm" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Nombres
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Ej. Carlos"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Apellidos
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Ej. Mendoza"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="correo@textil-lym.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Contraseña Temporal
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Rol Operacional
              </label>
              <Select
                value={role}
                onChange={(value) => setRole(value as UserProfile['role'])}
                leftIcon={<Shield className="w-4 h-4" />}
                options={ROLE_OPTIONS}
                className="text-xs bg-slate-50 dark:bg-slate-800 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Estado
              </label>
              <Select
                value={status}
                onChange={(value) => setStatus(value as 'ACTIVE' | 'INACTIVE')}
                options={STATUS_OPTIONS}
                className="text-xs bg-slate-50 dark:bg-slate-800 py-2.5"
              />
            </div>
          </div>

          {/* Initials Avatar Preview */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <Avatar firstName={firstName} lastName={lastName} size="lg" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Avatar de usuario con iniciales
              </p>
              <p className="text-[11px] text-slate-400">
                Se generarán e identificarán automáticamente las iniciales del usuario.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
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
              <span>{isLoading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
    </Modal>
  );
};
