import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Layers,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { suppliersService } from '../services/suppliers.service';
import type {
  Supplier,
  SupplierStats,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierStatus,
} from '../types/suppliers.types';
import { SupplierModal } from '../components/SupplierModal';
import { DeleteSupplierConfirmModal } from '../components/DeleteSupplierConfirmModal';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useToast } from '../../../shared/hooks/useToast';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { hasPermission } from '../../../shared/lib/roles';

const STATUS_FILTERS: SelectOption[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'INACTIVE', label: 'Inactivos' },
];

export const SuppliersPage: React.FC = () => {
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Permisos
  const canCreate = hasPermission(sessionUser, 'suppliers:create');
  const canEdit = hasPermission(sessionUser, 'suppliers:edit');
  const canDelete = hasPermission(sessionUser, 'suppliers:delete');
  const hasActionPermissions = canEdit || canDelete;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await suppliersService.getSuppliers({
        q: searchQuery || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      if (data) {
        setSuppliers(data.suppliers || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error cargando proveedores:', err);
      toast.error('Error al conectar con el servidor para cargar los proveedores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [searchQuery, selectedStatus]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleSaveSupplier = async (data: CreateSupplierDTO | UpdateSupplierDTO, id?: string) => {
    if (id) {
      await suppliersService.updateSupplier(id, data as UpdateSupplierDTO);
      toast.success('Proveedor actualizado exitosamente.');
    } else {
      await suppliersService.createSupplier(data as CreateSupplierDTO);
      toast.success('Proveedor creado exitosamente.');
    }
    await loadSuppliers();
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      const res = await suppliersService.deleteSupplier(supplierToDelete.id);
      toast.success(res.message || 'Proveedor eliminado exitosamente.');
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
      await loadSuppliers();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj?.response?.data?.error || 'Error al eliminar el proveedor.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: SupplierStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Inactivo
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {/* Top indeterminate loader when refreshing/updating data */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[999] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-primary-500 w-full animate-pulse" />
        </div>
      )}

      {/* 1. Header Bar */}
      <PageHeader
        eyebrowIcon={<Truck className="w-4 h-4" />}
        eyebrow="Mantenedor de Proveedores • Clientes y Suministros de Hilo"
        title="Gestión de Proveedores"
        subtitle="Administración de proveedores y clientes de hilado para tejeduría y producción textil."
        action={
          canCreate && (
            <Button variant="secondary" size="cta" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              <span>Nuevo Proveedor</span>
            </Button>
          )
        }
      />

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-7 w-12 mb-1" />
            ) : (
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight font-mono">
                {stats.total}
              </p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Proveedores</p>
          </div>
        </div>

        {/* Activos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-7 w-12 mb-1" />
            ) : (
              <p className="text-2xl font-black text-primary-600 dark:text-primary-400 leading-tight font-mono">
                {stats.active}
              </p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Activos / Operativos</p>
          </div>
        </div>

        {/* Inactivos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-7 w-12 mb-1" />
            ) : (
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300 leading-tight font-mono">
                {stats.inactive}
              </p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inactivos / Suspendidos</p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por RUC, razón social, tipo de hilo o contacto..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Filter by Status */}
        <div className="w-full md:w-56">
          <Select
            options={STATUS_FILTERS}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Filtrar por estado..."
          />
        </div>

        {/* Refresh button */}
        <Tooltip content="Recargar proveedores">
          <button
            onClick={loadSuppliers}
            aria-label="Recargar proveedores"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 self-end md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </Tooltip>
      </div>

      {/* 4. Suppliers Table Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 sm:p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-10 w-44 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-16 rounded-xl" />
              </div>
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Truck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No se encontraron proveedores
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {searchQuery || selectedStatus !== 'ALL'
                  ? 'Prueba a cambiar los filtros o el término de búsqueda.'
                  : 'Registra el primer proveedor o cliente de hilado para asignarlo a los lotes de producción.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">RUC / DOCUMENTO</th>
                  <th className="py-3 px-4">RAZÓN SOCIAL / CLIENTE</th>
                  <th className="py-3 px-4">CONTACTO & CORREO</th>
                  <th className="py-3 px-4">HILADOS SUMINISTRADOS</th>
                  <th className="py-3 px-3 text-center">LOTES</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  {hasActionPermissions && <th className="py-3 px-4 text-right">ACCIONES</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {suppliers.map((supplier, idx) => (
                  <tr
                    key={supplier.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-900/40'
                      }`}
                  >
                    {/* Document */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        {supplier.document}
                      </span>
                    </td>

                    {/* Name & Address */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {supplier.name}
                        </p>
                        {supplier.address && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[12rem] sm:max-w-xs">{supplier.address}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <p className="flex items-center gap-1.5 font-mono text-xs">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{supplier.phone}</span>
                          </p>
                        )}
                        {supplier.email && (
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[180px]">{supplier.email}</span>
                          </p>
                        )}
                        {!supplier.phone && !supplier.email && <span className="text-slate-400">-</span>}
                      </div>
                    </td>

                    {/* Yarn Types */}
                    <td className="py-3 px-4">
                      {supplier.yarnTypes && (Array.isArray(supplier.yarnTypes) ? supplier.yarnTypes.length > 0 : String(supplier.yarnTypes).trim()) ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200">
                          <Layers className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                          <span className="font-semibold">
                            {Array.isArray(supplier.yarnTypes) ? supplier.yarnTypes.join(', ') : supplier.yarnTypes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No especificado</span>
                      )}
                    </td>

                    {/* Batches Count */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                      {supplier._count?.productionBatches || 0}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">{getStatusBadge(supplier.status)}</td>

                    {/* Actions */}
                    {hasActionPermissions && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Tooltip content="Editar proveedor">
                              <button
                                onClick={() => handleOpenEdit(supplier)}
                                className="p-2.5 sm:p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip content="Eliminar proveedor">
                              <button
                                onClick={() => handleOpenDelete(supplier)}
                                className="p-2.5 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        editingSupplier={editingSupplier}
      />

      <DeleteSupplierConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        supplier={supplierToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
