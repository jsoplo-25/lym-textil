import React, { useState, useEffect } from 'react';
import {
  Plus,
  Lock,
  Edit2,
  Trash2,
  KeyRound,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { rolesService } from '../services/roles.service';
import type { RoleDefinition, CreateRoleDTO, UpdateRoleDTO } from '../types/roles.types';
import { RoleModal } from '../components/RoleModal';
import { DeleteRoleConfirmModal } from '../components/DeleteRoleConfirmModal';
import { useToast } from '../../../shared/hooks/useToast';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { updateUserProfile } from '../../../entities/session/sessionSlice';
import { setCachedRoles, hasPermission } from '../../../shared/lib/roles';

export const RolesPage: React.FC = () => {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  // Permisos dinámicos para roles
  const canCreateRole = hasPermission(sessionUser, 'roles:create');
  const canEditRole = hasPermission(sessionUser, 'roles:edit');
  const canDeleteRole = hasPermission(sessionUser, 'roles:delete');

  // Delete modal state
  const [deletingRole, setDeletingRole] = useState<RoleDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const data = await rolesService.getRoles();
      if (Array.isArray(data)) {
        setRoles(data);
        setCachedRoles(data);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleDefinition) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (role: RoleDefinition) => {
    setDeletingRole(role);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      const res = await rolesService.deleteRole(deletingRole.id);
      toast.success(res.message || `Rol [${deletingRole.name}] eliminado exitosamente.`);
      setDeletingRole(null);
      await loadRoles();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj?.response?.data?.error || 'Error al eliminar el rol.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRole = async (data: CreateRoleDTO | UpdateRoleDTO, id?: string) => {
    if (id) {
      const updated = await rolesService.updateRole(id, data as UpdateRoleDTO);
      toast.success('Rol actualizado exitosamente.');

      // Si el rol modificado coincide con el del usuario en sesión, actualizar de forma asíncrona e inmediata en Redux
      if (
        sessionUser &&
        updated &&
        (sessionUser.role === updated.code ||
          sessionUser.role === updated.id ||
          sessionUser.role === editingRole?.code ||
          sessionUser.role === editingRole?.id)
      ) {
        dispatch(updateUserProfile({ roleName: updated.name }));
      }
    } else {
      await rolesService.createRole(data as CreateRoleDTO);
      toast.success('Rol creado exitosamente.');
    }
    await loadRoles();
  };

  // Paleta reducida a 3 niveles: primario (emerald), secundario (tinta oscura) y escala de grises.
  const getColorClasses = (code: string) => {
    switch (code) {
      case 'ADMINISTRADOR':
        // Primario — máximo privilegio
        return {
          badge: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
          iconBg: 'bg-primary-500/15 text-primary-600 dark:text-primary-400',
          ring: 'group-hover:border-primary-500/40',
        };
      case 'MANAGER':
      case 'SUPERVISOR':
        // Secundario — mando intermedio
        return {
          badge: 'bg-slate-900/6 text-slate-700 dark:bg-white/10 dark:text-slate-200 border-slate-900/10 dark:border-white/15',
          iconBg: 'bg-slate-900/10 text-slate-800 dark:bg-white/10 dark:text-slate-200',
          ring: 'group-hover:border-slate-400 dark:group-hover:border-slate-600',
        };
      default:
        // Neutro / Base — operario, calidad, auditor
        return {
          badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          iconBg: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          ring: 'group-hover:border-slate-300 dark:group-hover:border-slate-700',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {/* Top indeterminate loader when refreshing/updating data */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[999] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-primary-500 w-full animate-pulse" />
        </div>
      )}

      <PageHeader
        eyebrowIcon={<KeyRound className="w-4 h-4" />}
        eyebrow="Mantenedor de Roles • Permisos y Accesos"
        title="Gestión de Roles"
        subtitle="Administra los niveles de autorización y facultades asignadas a cada perfil en el sistema."
        action={
          canCreateRole && (
            <Button variant="secondary" size="cta" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              <span>Nuevo Rol</span>
            </Button>
          )
        }
      />

      {/* Grid of Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-3.5 w-16" />
              </div>

              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-3 w-full mb-1.5" />
              <Skeleton className="h-3 w-2/3 mb-4" />

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Skeleton className="h-3 w-32 mb-2" />
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-lg" />
                  <Skeleton className="h-5 w-14 rounded-lg" />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24 rounded-xl" />
              </div>
            </div>
          ))
        ) : roles.map((role) => {
          const colors = getColorClasses(role.code);

          return (
            <div
              key={role.id}
              className={`group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between ${colors.ring}`}
            >
              <div>
                {/* Top Badge & System Flag */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge className={colors.badge}>{role.name}</Badge>

                  {role.isSystem ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Nativo</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400">
                      <Sparkles className="w-3 h-3" />
                      <span>Personalizado</span>
                    </span>
                  )}
                </div>

                {/* Role Title & Description */}
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {role.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({role.code})
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed min-h-[3rem]">
                  {role.description}
                </p>

                {/* Permissions Preview Chips */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Permisos Asignados</span>
                    </span>
                    <span className="text-slate-400 font-semibold">{role.permissions.length}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
                    {role.permissions.slice(0, 5).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 truncate max-w-[130px]"
                      >
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="px-2 py-0.5 rounded-lg bg-primary-500/10 text-[10px] font-bold text-primary-600 dark:text-primary-400">
                        +{role.permissions.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Textil L&M RBAC</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {canEditRole && (
                    <button
                      onClick={() => handleOpenEdit(role)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Configurar rol y permisos"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Configurar</span>
                    </button>
                  )}

                  {canDeleteRole && role.code !== 'ADMINISTRADOR' && !role.isSystem && (
                    <button
                      onClick={() => handleOpenDelete(role)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={`Eliminar rol ${role.name}`}
                      aria-label={`Eliminar rol ${role.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {!canEditRole && !canDeleteRole && (
                    <span className="text-[11px] font-semibold text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      Lectura
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Config Modal */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRole}
        editingRole={editingRole}
      />

      {/* Role Delete Confirm Modal */}
      <DeleteRoleConfirmModal
        isOpen={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleConfirmDelete}
        role={deletingRole}
        isLoading={isDeleting}
      />
    </div>
  );
};
