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
import { rolesService } from '../../roles/services/roles.service';
import type { RoleDefinition } from '../../roles/types/roles.types';
import { UserModal } from '../components/UserModal';
import { DeleteUserConfirmModal } from '../components/DeleteUserConfirmModal';
import { Avatar } from '../../../shared/ui/Avatar';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import {
  TableContainer,
  Table,
  TableHead,
  Th,
  TableBody,
  Tr,
  Td,
  TableEmptyRow,
} from '../../../shared/ui/Table';
import { useToast } from '../../../shared/hooks/useToast';
import { getRoleDisplayName, hasPermission } from '../../../shared/lib/roles';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { updateUserProfile } from '../../../entities/session/sessionSlice';

export const UsersPage: React.FC = () => {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Permisos operativos para usuarios
  const canCreate = hasPermission(sessionUser, 'users:create');
  const canEdit = hasPermission(sessionUser, 'users:edit');
  const canDelete = hasPermission(sessionUser, 'users:delete');
  const hasActionPermissions = canEdit || canDelete;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadRoles = async () => {
    try {
      const data = await rolesService.getRoles();
      if (data && data.length > 0) {
        setRolesList(data);
      }
    } catch {
      // Ignorar fallback silencioso
    }
  };

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
    loadRoles();
  }, []);

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
      toast.success('Usuario actualizado exitosamente.');

      // Si el usuario actualizado es el usuario logueado en la sesión activa
      if (sessionUser && sessionUser.id === id) {
        const newRoleName = data.role ? getRoleDisplayName(data.role, rolesList) : undefined;
        dispatch(
          updateUserProfile({
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || undefined,
            email: data.email,
            role: data.role,
            roleName: newRoleName,
            avatarUrl: data.avatarUrl,
          })
        );
      }
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
      toast.success('Usuario eliminado exitosamente.');
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

  const filterOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todos los roles' },
    ...rolesList.map((r) => ({ value: r.code, label: r.name })),
  ];

  const getRoleBadge = (user: ManagedUser) => {
    const descriptiveName = user.roleName || getRoleDisplayName(user.role, rolesList);
    return (
      <Badge variant={user.role === 'ADMINISTRADOR' ? 'emerald' : 'slate'}>{descriptiveName}</Badge>
    );
  };

  // Metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMINISTRADOR').length;
  const nonAdminCount = users.filter((u) => u.role !== 'ADMINISTRADOR').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {/* Top indeterminate loader when refreshing/updating data */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[999] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-primary-500 w-full animate-pulse" />
        </div>
      )}

      <PageHeader
        eyebrowIcon={<Users className="w-4 h-4" />}
        eyebrow="Mantenedor de Usuarios • Seguridad y Accesos"
        title="Gestión de Usuarios"
        subtitle="Control de cuentas, credenciales, estados de actividad y asignación de roles de planta."
        action={
          canCreate && (
            <Button variant="secondary" size="cta" onClick={handleOpenCreate}>
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </Button>
          )
        }
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Usuarios</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalUsers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-500">Administradores</span>
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">{adminCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Personal Operativo</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{nonAdminCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Cuentas Activas</span>
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">{activeCount}</p>
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              options={filterOptions}
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
      <TableContainer>
        <Table>
          <TableHead>
            <Th>ID</Th>
            <Th>Colaborador</Th>
            <Th>Cargo / Contacto</Th>
            <Th>Rol en Planta</Th>
            <Th>Estado</Th>
            <Th>Registro</Th>
            <Th align="right">Acciones</Th>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}>
                  <Td>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Skeleton className="h-3.5 w-24" />
                  </Td>
                  <Td>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </Td>
                  <Td>
                    <Skeleton className="h-3.5 w-16" />
                  </Td>
                  <Td>
                    <Skeleton className="h-3.5 w-20" />
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="w-8 h-8 rounded-xl" />
                      <Skeleton className="w-8 h-8 rounded-xl" />
                    </div>
                  </Td>
                </Tr>
              ))
            ) : users.length === 0 ? (
              <TableEmptyRow colSpan={7}>
                No se encontraron usuarios con los filtros seleccionados.
              </TableEmptyRow>
            ) : (
              users.map((user) => (
                <Tr key={user.id}>
                  {/* Worker ID */}
                  <Td>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {user.workerId || '-'}
                    </span>
                  </Td>

                  {/* User Identity */}
                  <Td>
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
                  </Td>

                  {/* Cargo & Phone */}
                  <Td>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {user.jobTitle || 'Sin cargo definido'}
                      </p>
                      {user.phone && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          📞 {user.phone}
                        </p>
                      )}
                    </div>
                  </Td>

                  {/* Role */}
                  <Td>{getRoleBadge(user)}</Td>

                  {/* Status */}
                  <Td>
                    {user.status === 'INACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Inactivo</span>
                      </span>
                    ) : user.status === 'SUSPENDED' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-accent-500 font-medium">
                        <XCircle className="w-4 h-4" />
                        <span>Suspendido</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Activo</span>
                      </span>
                    )}
                  </Td>

                  {/* Registered Date */}
                  <Td className="text-slate-400 font-mono text-xs">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'Reciente'}
                  </Td>

                  {/* Action Buttons */}
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <Tooltip content="Editar usuario">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            aria-label="Editar usuario"
                            className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip content="Eliminar usuario">
                          <button
                            onClick={() => handleOpenDelete(user)}
                            aria-label="Eliminar usuario"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}
                      {!hasActionPermissions && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          Solo lectura
                        </span>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
        availableRoles={rolesList}
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
