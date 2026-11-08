import React, { useState, useEffect } from 'react';
import { Shield, Save, CheckSquare, Square, Loader2 } from 'lucide-react';
import type { RoleDefinition, CreateRoleDTO, UpdateRoleDTO } from '../types/roles.types';
import { Modal } from '../../../shared/ui/Modal';
import { Alert } from '../../../shared/ui/Alert';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoleDTO | UpdateRoleDTO, id?: string) => Promise<void>;
  editingRole?: RoleDefinition | null;
}

const ALL_PERMISSIONS = [
  {
    category: 'Dashboard y Panel Principal',
    items: [
      { id: 'dashboard:view', label: 'Acceso al Dashboard y visualización de indicadores del sistema' },
    ],
  },
  {
    category: 'Mi Perfil de Usuario',
    items: [
      { id: 'profile:view', label: 'Consultar datos personales y facultades asignadas' },
      { id: 'profile:edit', label: 'Actualizar información de contacto y cambiar contraseña personal' },
    ],
  },
  {
    category: 'Mantenedor de Usuarios',
    items: [
      { id: 'users:read', label: 'Consultar lista de colaboradores y estados de cuenta' },
      { id: 'users:create', label: 'Registrar y dar de alta nuevos colaboradores' },
      { id: 'users:edit', label: 'Modificar datos, estado de cuenta y contraseñas de colaboradores' },
      { id: 'users:delete', label: 'Dar de baja y eliminar cuentas de colaboradores' },
    ],
  },
  {
    category: 'Mantenedor de Roles y Permisos',
    items: [
      { id: 'roles:read', label: 'Consultar matriz de roles y facultades del sistema' },
      { id: 'roles:create', label: 'Crear nuevos roles de trabajo' },
      { id: 'roles:edit', label: 'Modificar facultades y permisos de roles' },
      { id: 'roles:delete', label: 'Eliminar roles de trabajo personalizados' },
    ],
  },
  {
    category: 'Mantenedor de Máquinas',
    items: [
      { id: 'machines:read', label: 'Consultar inventario, conteo y estado operativo de máquinas' },
      { id: 'machines:create', label: 'Registrar y dar de alta nuevas máquinas' },
      { id: 'machines:edit', label: 'Modificar datos técnicos, ubicación y estado de máquinas' },
      { id: 'machines:delete', label: 'Dar de baja y eliminar máquinas del inventario' },
    ],
  },
  {
    category: 'Mantenedor de Proveedores',
    items: [
      { id: 'suppliers:read', label: 'Consultar directorio de proveedores y clientes de hilado' },
      { id: 'suppliers:create', label: 'Registrar y dar de alta nuevos proveedores o clientes' },
      { id: 'suppliers:edit', label: 'Modificar datos de contacto, hilados y estado de proveedores' },
      { id: 'suppliers:delete', label: 'Eliminar proveedores del directorio comercial' },
    ],
  },
  {
    category: 'Control de Producción',
    items: [
      { id: 'production:read', label: 'Consultar sábanas de producción, lotes y pesaje de rollos' },
      { id: 'production:create', label: 'Crear nuevos lotes y registrar rollos producidos' },
      { id: 'production:edit', label: 'Modificar datos de lotes, turnos, operarios y peso de rollos' },
      { id: 'production:delete', label: 'Eliminar lotes u órdenes de rollos del historial' },
      { id: 'production:approve', label: 'Aprobar rollos de producción y pasarlos a Listo para Recojo' },
    ],
  },
];

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRole,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingRole) {
      setCode(editingRole.code);
      setName(editingRole.name);
      setDescription(editingRole.description);
      setSelectedPermissions(editingRole.permissions || []);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setSelectedPermissions([]);
    }
    setError(null);
  }, [editingRole, isOpen]);

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleAllCategory = (items: { id: string }[]) => {
    const allSelected = items.every((i) => selectedPermissions.includes(i.id));
    if (allSelected) {
      const idsToRemove = items.map((i) => i.id);
      setSelectedPermissions((prev) => prev.filter((p) => !idsToRemove.includes(p)));
    } else {
      const idsToAdd = items.map((i) => i.id).filter((id) => !selectedPermissions.includes(id));
      setSelectedPermissions((prev) => [...prev, ...idsToAdd]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (editingRole) {
        await onSave(
          {
            name,
            description,
            permissions: selectedPermissions,
          },
          editingRole.id
        );
      } else {
        await onSave({
          code,
          name,
          description,
          permissions: selectedPermissions,
        });
      }
      if (!editingRole) {
        setCode('');
        setName('');
        setDescription('');
        setSelectedPermissions([]);
      }
      onClose();
    } catch (err: unknown) {
      const errorObj = err && typeof err === 'object' ? (err as { response?: { data?: { error?: string } }; message?: string }) : null;
      setError(errorObj?.response?.data?.error || errorObj?.message || 'Error al guardar rol.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      icon={<Shield className="w-5 h-5" />}
      title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
      description={
        editingRole
          ? `Modifica los accesos y facultades del rol [${editingRole.name}]`
          : 'Define el código y la matriz de permisos para el nuevo perfil'
      }
      isLoading={isLoading}
      loadingMessage={editingRole ? 'Actualizando facultades del rol...' : 'Creando nuevo rol...'}
    >
      {error && (
        <Alert variant="error" size="sm" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Código del Rol
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!!editingRole}
              required
              placeholder="Ej. AUDITOR_EXTERNO"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Nombre Descriptivo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Auditor de Calidad Externo"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            Descripción de Funciones
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe las responsabilidades del rol en la planta..."
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Permissions Matrix */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Matriz de Permisos Operacionales ({selectedPermissions.length} Seleccionados)
          </label>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {ALL_PERMISSIONS.map((group) => {
              const allSelected = group.items.every((i) => selectedPermissions.includes(i.id));

              return (
                <div
                  key={group.category}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {group.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleAllCategory(group.items)}
                      className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                    >
                      {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const isChecked = selectedPermissions.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => togglePermission(item.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${isChecked
                              ? 'bg-primary-500/10 text-primary-700 dark:text-primary-300 font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
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
            <span>{isLoading ? (editingRole ? 'Actualizando...' : 'Creando...') : editingRole ? 'Guardar Cambios' : 'Crear Rol'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

