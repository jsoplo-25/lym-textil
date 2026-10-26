import React, { useState, useEffect } from 'react';
import {
  Cog,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  MapPin,
  Layers,
  FileText,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { machinesService } from '../services/machines.service';
import type {
  Machine,
  MachineStatus,
  MachineStats,
  CreateMachineDTO,
  UpdateMachineDTO,
} from '../types/machines.types';
import { MachineModal } from '../components/MachineModal';
import { DeleteMachineConfirmModal } from '../components/DeleteMachineConfirmModal';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useToast } from '../../../shared/hooks/useToast';
import { hasPermission } from '../../../shared/lib/roles';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { TableContainer, Table, TableHead, Th, TableBody, Tr, Td } from '../../../shared/ui/Table';

const STATUS_FILTERS: SelectOption[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'OPERATIVE', label: 'Operativas' },
  { value: 'MAINTENANCE', label: 'En Mantenimiento' },
  { value: 'OUT_OF_SERVICE', label: 'Fuera de Servicio' },
];

const TYPE_FILTERS: SelectOption[] = [
  { value: 'ALL', label: 'Todos los procesos' },
  { value: 'Tejido', label: 'Tejido' },
];

export const MachinesPage: React.FC = () => {
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState<MachineStats>({
    total: 0,
    operative: 0,
    maintenance: 0,
    outOfService: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Permisos operativos
  const canCreate = hasPermission(sessionUser, 'machines:create');
  const canEdit = hasPermission(sessionUser, 'machines:edit');
  const canDelete = hasPermission(sessionUser, 'machines:delete');
  const hasActionPermissions = canEdit || canDelete;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const loadMachines = async () => {
    setIsLoading(true);
    try {
      const data = await machinesService.getMachines({
        q: searchQuery || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
      });
      if (data) {
        setMachines(data.machines || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error cargando máquinas:', err);
      toast.error('Error al conectar con el servidor para cargar las máquinas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, [searchQuery, selectedStatus, selectedType]);

  const handleOpenCreate = () => {
    setEditingMachine(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (machine: Machine) => {
    setMachineToDelete(machine);
    setIsDeleteModalOpen(true);
  };

  const handleSaveMachine = async (data: CreateMachineDTO | UpdateMachineDTO, id?: string) => {
    if (id) {
      await machinesService.updateMachine(id, data);
      toast.success('Máquina actualizada exitosamente.');
    } else {
      await machinesService.createMachine(data as CreateMachineDTO);
      toast.success('Máquina creada exitosamente.');
    }
    await loadMachines();
  };

  const handleConfirmDelete = async () => {
    if (!machineToDelete) return;
    setIsDeleting(true);
    try {
      await machinesService.deleteMachine(machineToDelete.id);
      toast.success(`Máquina [${machineToDelete.code}] eliminada exitosamente.`);
      setIsDeleteModalOpen(false);
      setMachineToDelete(null);
      await loadMachines();
    } catch (err: unknown) {
      console.error('Error al eliminar máquina:', err);
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al eliminar la máquina. Intente nuevamente.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status: MachineStatus) => {
    switch (status) {
      case 'OPERATIVE':
        return (
          <Badge variant="emerald">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Operativa
          </Badge>
        );
      case 'MAINTENANCE':
        return (
          <Badge variant="amber">
            <AlertTriangle className="w-3.5 h-3.5" />
            Mantenimiento
          </Badge>
        );
      case 'OUT_OF_SERVICE':
        return (
          <Badge variant="rose">
            <XCircle className="w-3.5 h-3.5" />
            Fuera de Servicio
          </Badge>
        );
      default:
        return null;
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

      {/* 1. Header & Actions */}
      <PageHeader
        eyebrowIcon={<Cog className="w-4 h-4" />}
        eyebrow="Mantenedor de Máquinas • Inventario y Estado Operativo"
        title="Gestión de Máquinas"
        subtitle="Inventario de maquinaria, conteo general y control del estado operativo en planta."
        action={
          canCreate && (
            <Button variant="secondary" size="cta" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              <span>Nueva Máquina</span>
            </Button>
          )
        }
      />

      {/* 2. KPI / Overview Cards */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Máquinas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Máquinas
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Cog className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.total}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Inventario general registrado</p>
          </div>
        </div>

        {/* Operativas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              Operativas
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-primary-600 dark:text-primary-400 font-mono">
              {stats.operative}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {stats.total > 0 ? `${Math.round((stats.operative / stats.total) * 100)}% de capacidad activa` : 'Sin máquinas'}
            </p>
          </div>
        </div>

        {/* En Mantenimiento */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-accent-600 dark:text-accent-400 uppercase tracking-wider">
              Mantenimiento
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-accent-600 dark:text-accent-400 font-mono">
              {stats.maintenance}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">En servicio técnico o calibración</p>
          </div>
        </div>

        {/* Fuera de Servicio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Fuera de Servicio
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {stats.outOfService}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Inactivas o pendientes de repuesto</p>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (ej. MQ-001), nombre, marca, serie, ubicación..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Dropdowns Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Status filter */}
          <div className="w-full sm:w-44 lg:w-48">
            <Select
              options={STATUS_FILTERS}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Estado..."
            />
          </div>

          {/* Type/Process filter */}
          <div className="w-full sm:w-44 lg:w-48">
            <Select
              options={TYPE_FILTERS}
              value={selectedType}
              onChange={setSelectedType}
              placeholder="Proceso..."
            />
          </div>

          {/* Refresh */}
          <button
            onClick={loadMachines}
            title="Actualizar lista"
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Table / Cards View */}
      {isLoading && machines.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-4 sm:p-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : machines.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Cog className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No se encontraron máquinas
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                ? 'No hay registros que coincidan con los filtros aplicados. Intenta restablecer los filtros de búsqueda.'
                : 'Aún no has registrado ninguna máquina en el sistema. Comienza dando de alta la primera máquina.'}
            </p>
          </div>
          {canCreate && !searchQuery && selectedStatus === 'ALL' && selectedType === 'ALL' && (
            <Button variant="secondary" size="cta" onClick={handleOpenCreate} className="mt-2">
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Máquina</span>
            </Button>
          )}
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <Th>Código / Máquina</Th>
              <Th>Proceso / Tipo</Th>
              <Th>Marca / Modelo</Th>
              <Th>N° de Serie</Th>
              <Th>Ubicación</Th>
              <Th>Estado</Th>
              <Th>Notas</Th>
              {hasActionPermissions && <Th align="right">Acciones</Th>}
            </TableHead>
            <TableBody>
              {machines.map((machine) => (
                <Tr key={machine.id}>
                  {/* Código y Nombre */}
                  <Td>
                    <div className="flex items-center gap-3 min-w-[10rem]">
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-extrabold text-[11px] shadow-xs">
                        {machine.code}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {machine.name}
                        </p>
                      </div>
                    </div>
                  </Td>

                  {/* Tipo / Proceso */}
                  <Td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {machine.type || 'General'}
                    </span>
                  </Td>

                  {/* Marca y Modelo */}
                  <Td className="text-slate-600 dark:text-slate-300">
                    {machine.brand || machine.model ? (
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {machine.brand || '-'}
                        </span>
                        {machine.model && (
                          <span className="text-slate-400 text-[11px] block">{machine.model}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No especificada</span>
                    )}
                  </Td>

                  {/* N° Serie */}
                  <Td>
                    {machine.serialNumber ? (
                      <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                        {machine.serialNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">S/N</span>
                    )}
                  </Td>

                  {/* Ubicación */}
                  <Td>
                    {machine.location ? (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span>{machine.location}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Sin asignar</span>
                    )}
                  </Td>

                  {/* Estado */}
                  <Td>{renderStatusBadge(machine.status)}</Td>

                  {/* Observaciones / Notas */}
                  <Td className="max-w-[10rem] sm:max-w-xs">
                    {machine.notes ? (
                      <Tooltip content={machine.notes}>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate cursor-help">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{machine.notes}</span>
                        </div>
                      </Tooltip>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">-</span>
                    )}
                  </Td>

                  {/* Acciones */}
                  {hasActionPermissions && (
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Tooltip content="Editar máquina">
                            <button
                              onClick={() => handleOpenEdit(machine)}
                              className="p-2.5 sm:p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip content="Dar de baja máquina">
                            <button
                              onClick={() => handleOpenDelete(machine)}
                              className="p-2.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modals */}
      <MachineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMachine}
        editingMachine={editingMachine}
      />

      <DeleteMachineConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        machine={machineToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
