import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Scale,
  Calendar,
  Eye,
  Clock,
  Truck,
  FileSpreadsheet,
  ClipboardList,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { productionService } from '../services/production.service';
import { machinesService } from '../../machines/services/machines.service';
import { suppliersService } from '../../suppliers/services/suppliers.service';
import type {
  ProductionBatch,
  ProductionStats,
  CreateBatchDTO,
  UpdateBatchDTO,
  BatchStatus,
} from '../types/production.types';
import { ProductionBatchModal } from '../components/ProductionBatchModal';
import { DeleteBatchConfirmModal } from '../components/DeleteBatchConfirmModal';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useToast } from '../../../shared/hooks/useToast';
import { hasPermission } from '../../../shared/lib/roles';
import { formatLocalDate } from '../../../shared/lib/utils';
import { Select, type SelectOption } from '../../../shared/ui/Select';
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

const STATUS_FILTERS: SelectOption[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'REQUESTED', label: 'Solicitud registrada' },
  { value: 'COMPLETED', label: 'Terminado' },
];

export const ProductionBatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [machineOptions, setMachineOptions] = useState<SelectOption[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<SelectOption[]>([]);
  const [stats, setStats] = useState<ProductionStats>({
    totalBatches: 0,
    requestedBatches: 0,
    completedBatches: 0,
    totalRollsProduced: 0,
    totalWeightKg: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Permisos
  const canCreate = hasPermission(sessionUser, 'production:create');
  const canEdit = hasPermission(sessionUser, 'production:edit');
  const canDelete = hasPermission(sessionUser, 'production:delete');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductionBatch | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ProductionBatch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadFilterOptions = async () => {
    try {
      const [machRes, suppRes] = await Promise.all([
        machinesService.getMachines().catch(() => null),
        suppliersService.getSuppliers().catch(() => null),
      ]);

      if (machRes && machRes.machines) {
        setMachineOptions([
          { value: 'ALL', label: 'Todas las máquinas' },
          ...machRes.machines.map((m) => ({
            value: m.id,
            label: `[${m.code}] ${m.name}`,
          })),
        ]);
      }

      if (suppRes && suppRes.suppliers) {
        setSupplierOptions([
          { value: 'ALL', label: 'Todos los proveedores' },
          ...suppRes.suppliers.map((s) => ({
            value: s.id,
            label: s.name,
          })),
        ]);
      }
    } catch {
      // Ignorar fallback
    }
  };

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await productionService.getBatches({
        q: searchQuery || undefined,
        machineId: selectedMachine !== 'ALL' ? selectedMachine : undefined,
        supplierId: selectedSupplier !== 'ALL' ? selectedSupplier : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      if (data) {
        setBatches(data.batches || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error cargando lotes:', err);
      toast.error('Error al conectar con el servidor para cargar los lotes de producción.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadBatches();
  }, [searchQuery, selectedMachine, selectedSupplier, selectedStatus]);

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch: ProductionBatch, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBatch(batch);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (batch: ProductionBatch, e: React.MouseEvent) => {
    e.stopPropagation();
    setBatchToDelete(batch);
    setIsDeleteModalOpen(true);
  };

  const handleSaveBatch = async (data: CreateBatchDTO | UpdateBatchDTO, id?: string) => {
    if (id) {
      await productionService.updateBatch(id, data);
      toast.success('Lote de producción actualizado exitosamente.');
    } else {
      const created = await productionService.createBatch(data as CreateBatchDTO);
      toast.success('Lote de producción creado exitosamente.');
      navigate(`/production/${created.id}`);
      return;
    }
    await loadBatches();
  };

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    setIsDeleting(true);
    try {
      await productionService.deleteBatch(batchToDelete.id);
      toast.success(`Lote [${batchToDelete.batchNumber}] eliminado exitosamente.`);
      setIsDeleteModalOpen(false);
      setBatchToDelete(null);
      await loadBatches();
    } catch (err: unknown) {
      console.error('Error al eliminar lote:', err);
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al eliminar el lote.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case 'REQUESTED':
      case 'IN_PROGRESS':
      case 'IN_PREPARATION':
        return (
          <Badge variant="blue" icon={<ClipboardList className="w-3.5 h-3.5" />}>
            Solicitud registrada
          </Badge>
        );
      case 'COMPLETED':
      case 'READY_FOR_PICKUP':
      case 'DELIVERED':
      case 'DISPATCHED':
        return (
          <Badge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            Terminado
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" icon={<Clock className="w-3.5 h-3.5" />}>
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top indeterminate loader when refreshing/updating data */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[999] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-primary-500 w-full animate-pulse" />
        </div>
      )}

      {/* 1. Header */}
      <PageHeader
        eyebrowIcon={<Factory className="w-4 h-4" />}
        eyebrow="Control de Producción • Lotes e Hilos"
        title="Gestión de Producción"
        subtitle="Sábanas de producción por máquina y lote. Avance semanal de hilos por proveedor, pesaje y control de entrega."
        action={
          canCreate && (
            <Button variant="secondary" size="cta" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              <span>Nuevo Lote</span>
            </Button>
          )
        }
      />

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Lotes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Lotes
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.totalBatches}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Órdenes registradas</p>
          </div>
        </div>

        {/* Solicitud Registrada */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Solicitud Registrada
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {stats.requestedBatches}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Lotes en proceso de hilado</p>
          </div>
        </div>

        {/* Terminados */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              Terminados
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-primary-600 dark:text-primary-400 font-mono">
              {stats.completedBatches}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Lotes entregados por completo</p>
          </div>
        </div>

        {/* Total Rollos y Peso */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Rollos y Kilos
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.totalRollsProduced}{' '}
              <span className="text-xs font-sans font-bold text-slate-500">rollos</span>
            </span>
            <p className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400 mt-0.5">
              {stats.totalWeightKg.toLocaleString()} Kg total
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por lote, máquina, proveedor o notas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/70 dark:bg-slate-800/70 border border-transparent focus:border-primary-500/50 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap lg:flex-nowrap">
          <div className="w-full sm:w-44">
            <Select
              options={supplierOptions.length > 0 ? supplierOptions : [{ value: 'ALL', label: 'Todos los proveedores' }]}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              placeholder="Proveedor..."
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              options={machineOptions.length > 0 ? machineOptions : [{ value: 'ALL', label: 'Todas las máquinas' }]}
              value={selectedMachine}
              onChange={setSelectedMachine}
              placeholder="Máquina..."
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              options={STATUS_FILTERS}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Estado..."
            />
          </div>

          <button
            onClick={loadBatches}
            title="Actualizar lista"
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Table of Batches */}
      <TableContainer>
        {isLoading && batches.length === 0 ? (
          <div className="p-4 sm:p-6 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <Table>
            <TableHead>
              <Th>Lote</Th>
              <Th>Cód. Seguimiento</Th>
              <Th>Proveedor / Cliente</Th>
              <Th>Hilos en Producción</Th>
              <Th>Máquina</Th>
              <Th>Fecha Inicio</Th>
              <Th>Rollos</Th>
              <Th>Peso Total</Th>
              <Th>Estado Lote</Th>
              <Th>Notas</Th>
              <Th align="right">Acciones</Th>
            </TableHead>
            <TableBody>
              {batches.length === 0 ? (
                <TableEmptyRow colSpan={11}>
                  <div className="flex flex-col items-center justify-center space-y-3 py-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        No se encontraron lotes de producción
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery || selectedMachine !== 'ALL' || selectedSupplier !== 'ALL' || selectedStatus !== 'ALL'
                          ? 'No hay registros que coincidan con los filtros aplicados. Restablece la búsqueda para ver todos.'
                          : 'Aún no hay ningún lote de producción registrado. Crea el primer lote para cargar su sábana de rollos.'}
                      </p>
                    </div>
                    {canCreate && !searchQuery && selectedMachine === 'ALL' && selectedSupplier === 'ALL' && selectedStatus === 'ALL' && (
                      <Button variant="secondary" size="md" className="mt-2" onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4" />
                        <span>Crear Primer Lote</span>
                      </Button>
                    )}
                  </div>
                </TableEmptyRow>
              ) : (
                batches.map((batch) => (
                  <Tr
                    key={batch.id}
                    onClick={() => navigate(`/production/${batch.id}`)}
                    className="cursor-pointer group"
                  >
                    {/* N° Lote (Solo lectura, sin botón copiar) */}
                    <Td>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-mono font-bold text-xs shadow-xs inline-block">
                        {batch.batchNumber}
                      </span>
                    </Td>

                    {/* Cód. Seguimiento ÚNICO con botón para copiar */}
                    <Td>
                      {batch.trackingCode ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/80 text-primary-700 dark:text-primary-300">
                          <span className="font-mono text-xs font-black tracking-wide">
                            {batch.trackingCode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(batch.trackingCode!);
                              toast.success(`Código de seguimiento [${batch.trackingCode}] copiado.`);
                            }}
                            className="p-1 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors cursor-pointer"
                            title="Copiar código de seguimiento"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono italic">
                          Sin código
                        </span>
                      )}
                    </Td>

                    {/* Proveedor */}
                    <Td>
                      {batch.supplierName ? (
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {batch.supplierName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin proveedor</span>
                      )}
                    </Td>

                    {/* Hilos Asignados */}
                    <Td>
                      {batch.yarns && batch.yarns.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {batch.yarns.map((y) => (
                            <span
                              key={y.id}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${y.status === 'READY_FOR_PICKUP'
                                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                                : y.status === 'DELIVERED'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                  : 'bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 border-accent-300 dark:border-accent-700'
                                }`}
                              title={`Estado: ${y.status}`}
                            >
                              {y.yarnName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin hilos registrados</span>
                      )}
                    </Td>

                    {/* Máquina */}
                    <Td>
                      {batch.machineCode || batch.machineName ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {batch.machineCode ? `[${batch.machineCode}] ` : ''}
                            {batch.machineName || ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin máquina</span>
                      )}
                    </Td>

                    {/* Fecha */}
                    <Td className="text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs">
                          {formatLocalDate(batch.startDate)}
                        </span>
                      </div>
                    </Td>

                    {/* Rollos */}
                    <Td>
                      <span className="font-bold font-mono text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
                        {batch.totalRolls || 0}
                      </span>
                    </Td>

                    {/* Peso Total */}
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-extrabold font-mono text-primary-600 dark:text-primary-400 text-xs">
                          {(batch.totalWeight || 0).toFixed(2)} Kg
                        </span>
                        {Boolean(batch.totalFabricKg && batch.totalFabricKg > 0) && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Meta: {batch.totalFabricKg?.toFixed(2)} Kg
                          </span>
                        )}
                      </div>
                    </Td>

                    {/* Estado General Lote */}
                    <Td>{renderStatusBadge(batch.status)}</Td>

                    {/* Notas */}
                    <Td className="max-w-xs truncate text-slate-500 dark:text-slate-400 text-xs">
                      {batch.notes || <span className="text-slate-400 italic text-[11px]">-</span>}
                    </Td>

                    {/* Acciones */}
                    <Td align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="Ver sábana y rollos">
                          <button
                            onClick={() => navigate(`/production/${batch.id}`)}
                            className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip content="Editar lote">
                            <button
                              onClick={(e) => handleOpenEdit(batch, e)}
                              className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip content="Eliminar lote">
                            <button
                              onClick={(e) => handleOpenDelete(batch, e)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Modals */}
      <ProductionBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBatch}
        editingBatch={editingBatch}
      />

      <DeleteBatchConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        batch={batchToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
