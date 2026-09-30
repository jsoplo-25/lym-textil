import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { usersService } from '../services/users.service';
import type { ManagedUser, CreateUserDTO, UpdateUserDTO } from '../types/users.types';
import { UserModal } from '../components/UserModal';
import { DeleteUserConfirmModal } from '../components/DeleteUserConfirmModal';
import { Avatar } from '../../../shared/ui/Avatar';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useToast } from '../../../shared/hooks/useToast';

const ROLE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Todos los roles' },
  { value: 'ADMINISTRADOR', label: 'ADMINISTRADOR - Administrador General' },
  { value: 'OPERATOR', label: 'OPERATOR - Operario' },
];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersService.getUsers({
        q: searchQuery || undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
      });
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery, selectedRole]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: ManagedUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleSaveUser = async (data: CreateUserDTO | UpdateUserDTO, id?: string) => {
    if (id) {
      await usersService.updateUser(id, data as UpdateUserDTO);
      toast.success('Usuario actualizado correctamente.');
    } else {
      await usersService.createUser(data as CreateUserDTO);
      toast.success('Usuario creado exitosamente.');
    }
    await loadUsers();
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await usersService.deleteUser(userToDelete.id);
      toast.success('Usuario eliminado del sistema.');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err: unknown) {
      const errorObj = err && typeof err === 'object' ? (err as { response?: { data?: { error?: string } } }) : null;
      toast.error(errorObj?.response?.data?.error || 'Error al eliminar usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: ManagedUser['role']) => {
    if (role === 'ADMINISTRADOR') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ADMINISTRADOR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        OPERARIO
      </span>
    );
  };

  // Metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMINISTRADOR').length;
  const operatorCount = users.filter((u) => u.role === 'OPERATOR').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
            <Users className="w-4 h-4" />
            <span>Mantenedor de Usuarios • Seguridad y Accesos</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Control de cuentas, credenciales, estados de actividad y asignación de roles de planta.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Usuarios</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalUsers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Administradores</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{adminCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Operarios</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{operatorCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Cuentas Activas</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-56">
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              leftIcon={<Filter className="w-3.5 h-3.5" />}
              className="text-xs bg-slate-50 dark:bg-slate-800 py-2.5"
              options={ROLE_FILTER_OPTIONS}
            />
          </div>

          <Tooltip content="Recargar usuarios">
            <button
              onClick={loadUsers}
              aria-label="Recargar usuarios"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-4 px-6">Colaborador</th>
                <th className="py-4 px-6">Rol en Planta</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6">Registro</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-3.5 w-16" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="w-8 h-8 rounded-xl" />
                        <Skeleton className="w-8 h-8 rounded-xl" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron usuarios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User Identity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={user.firstName}
                          lastName={user.lastName}
                          size="md"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">{getRoleBadge(user.role)}</td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {user.status === 'INACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                          <XCircle className="w-4 h-4" />
                          <span>Inactivo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Activo</span>
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-6 text-slate-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'Reciente'}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip content="Editar usuario">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            aria-label="Editar usuario"
                            className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Eliminar usuario">
                          <button
                            onClick={() => handleOpenDelete(user)}
                            aria-label="Eliminar usuario"
                            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        user={userToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
