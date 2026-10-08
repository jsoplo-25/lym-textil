import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Layers,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  Truck,
  CheckCircle2,
  Bell,
  PackageCheck,
  Copy,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { productionService } from '../services/production.service';
import type {
  ProductionBatch,
  ProductionRoll,
  CreateRollDTO,
  UpdateRollDTO,
  CreateBatchDTO,
  UpdateBatchDTO,
  BatchStatus,
  RollStatus,
} from '../types/production.types';
import { RollModal, ROLL_STATUS_OPTIONS } from '../components/RollModal';
import { ProductionBatchModal } from '../components/ProductionBatchModal';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useToast } from '../../../shared/hooks/useToast';
import { hasPermission } from '../../../shared/lib/roles';
import { formatLocalDate, getTodayLocalDate } from '../../../shared/lib/utils';
import { DatePicker } from '../../../shared/ui/DatePicker';
import { TimePicker } from '../../../shared/ui/TimePicker';
import { Select, type SelectOption } from '../../../shared/ui/Select';
import { Button } from '../../../shared/ui/Button';
import { Table, TableBody, TableContainer, TableHead, Td, Th, Tr } from '../../../shared/ui/Table';

export const ProductionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionUser = useSelector((state: RootState) => state.session.user);

  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [operatorOptions, setOperatorOptions] = useState<SelectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Permisos
  const canCreate = hasPermission(sessionUser, 'production:create');
  const canEdit = hasPermission(sessionUser, 'production:edit');
  const canDelete = hasPermission(sessionUser, 'production:delete');

  // Modal Rollo
  const [isRollModalOpen, setIsRollModalOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<ProductionRoll | null>(null);

  // Modal Batch Edit
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Quick inline add state
  const [quickRollNumber, setQuickRollNumber] = useState('');
  const [quickStartDate, setQuickStartDate] = useState('');
  const [quickStartOperator, setQuickStartOperator] = useState('');
  const [quickStartTime, setQuickStartTime] = useState('');
  const [quickEndTime, setQuickEndTime] = useState('');
  const [quickEndDate, setQuickEndDate] = useState('');
  const [quickEndOperator, setQuickEndOperator] = useState('');
  const [quickWeight, setQuickWeight] = useState('');
  const [quickObservations, setQuickObservations] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const toast = useToast();

  const loadOperators = async () => {
    try {
      const operators = await productionService.getOperators();
      if (operators && operators.length > 0) {
        const opts: SelectOption[] = operators.map((op) => ({
          value: op.name,
          label: op.name,
        }));
        setOperatorOptions(opts);
      }
    } catch (err) {
      console.error('Error loading operators:', err);
    }
  };

  const loadBatch = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await productionService.getBatchById(id);
      if (data) {
        setBatch(data);
      }
    } catch (err) {
      console.error('Error cargando detalle del lote:', err);
      toast.error('Error al cargar la sábana de producción.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
    loadBatch();
    setQuickStartDate(getTodayLocalDate());
    setQuickEndDate(getTodayLocalDate());
  }, [id]);

  const handleOpenAddRoll = () => {
    setEditingRoll(null);
    setIsRollModalOpen(true);
  };

  const handleOpenEditRoll = (roll: ProductionRoll) => {
    setEditingRoll(roll);
    setIsRollModalOpen(true);
  };

  const handleSaveRoll = async (data: CreateRollDTO | UpdateRollDTO, rollId?: string) => {
    if (!id) return;
    if (rollId) {
      await productionService.updateRoll(rollId, data);
      toast.success('Rollo actualizado correctamente.');
    } else {
      await productionService.addRoll(id, data as CreateRollDTO);
      toast.success('Rollo añadido a la sábana de producción.');
    }
    await loadBatch();
  };

  const handleDeleteRoll = async (roll: ProductionRoll) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rollo N° ${roll.rollNumber}?`)) {
      return;
    }
    try {
      await productionService.deleteRoll(roll.id);
      toast.success(`Rollo N° ${roll.rollNumber} eliminado.`);
      await loadBatch();
    } catch (err) {
      console.error('Error eliminando rollo:', err);
      toast.error('Error al eliminar el rollo.');
    }
  };

  const handleQuickAddRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!quickRollNumber.trim()) {
      toast.error('Ingresa el número de rollo.');
      return;
    }

    try {
      setIsQuickAdding(true);
      const payload: CreateRollDTO = {
        rollNumber: quickRollNumber.trim(),
        startDate: quickStartDate.trim() || undefined,
        startTime: quickStartTime.trim() || undefined,
        startOperator: quickStartOperator.trim() || undefined,
        endDate: quickEndDate.trim() || undefined,
        endTime: quickEndTime.trim() || undefined,
        endOperator: quickEndOperator.trim() || undefined,
        weight: quickWeight.trim() !== '' ? parseFloat(quickWeight) : undefined,
        status: 'REGISTERED',
        observations: quickObservations.trim() || undefined,
      };

      await productionService.addRoll(id, payload);
      toast.success(`Rollo N° ${quickRollNumber} registrado.`);

      // Siguiente sugerencia de rollo
      const parsedNum = parseInt(quickRollNumber, 10);
      if (!isNaN(parsedNum)) {
        setQuickRollNumber(String(parsedNum + 1));
      } else {
        setQuickRollNumber('');
      }
      setQuickWeight('');
      setQuickObservations('');

      await loadBatch();
    } catch (err: unknown) {
      console.error('Error en registro rápido:', err);
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        'Error al registrar rollo.';
      toast.error(msg);
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleSaveBatchHeader = async (data: CreateBatchDTO | UpdateBatchDTO) => {
    if (!id) return;
    await productionService.updateBatch(id, data);
    toast.success('Cabecera del lote actualizada.');
    await loadBatch();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !batch) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lote de producción no encontrado</h2>
        <button
          onClick={() => navigate('/production')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado</span>
        </button>
      </div>
    );
  }

  const rolls = batch.rolls || [];
  const totalRolls = rolls.length;
  const totalWeight = rolls.reduce((sum, r) => sum + (r.weight || 0), 0);
  const avgWeight = totalRolls > 0 ? totalWeight / totalRolls : 0;
  const registeredRollsCount = rolls.filter((r) => !r.status || r.status === 'REGISTERED').length;
  const prepRollsCount = rolls.filter((r) => r.status === 'IN_PREPARATION').length;
  const readyRollsCount = rolls.filter((r) => r.status === 'READY_FOR_PICKUP').length;
  const deliveredRollsCount = rolls.filter((r) => r.status === 'DELIVERED').length;

  const handleQuickUpdateStatus = async (newStatus: BatchStatus) => {
    if (!id || !canEdit || !batch) return;
    if (batch.status === newStatus) return;
    try {
      await productionService.updateBatch(id, { status: newStatus });
      toast.success(
        newStatus === 'COMPLETED'
          ? 'Lote marcado como Terminado (todos los rollos entregados).'
          : 'Lote marcado como Solicitud registrada.'
      );
      await loadBatch();
    } catch (err) {
      console.error('Error actualizando estado:', err);
      toast.error('Error al actualizar el estado del lote.');
    }
  };

  // Cambio rápido del estado de un rollo
  const handleUpdateRollStatus = async (roll: ProductionRoll, newStatus: RollStatus) => {
    if (!id || !canEdit) return;
    if (roll.status === newStatus) return;
    try {
      await productionService.updateRoll(roll.id, { status: newStatus });
      if (newStatus === 'READY_FOR_PICKUP') {
        toast.success(`¡Rollo N° ${roll.rollNumber} listo para recojo! Se puede notificar al proveedor.`);
      } else if (newStatus === 'DELIVERED') {
        toast.success(`Rollo N° ${roll.rollNumber} marcado como entregado.`);
      } else if (newStatus === 'IN_PREPARATION') {
        toast.success(`Rollo N° ${roll.rollNumber} en preparación.`);
      } else {
        toast.success(`Rollo N° ${roll.rollNumber} marcado como registrado.`);
      }
      await loadBatch();
    } catch (err) {
      console.error('Error al actualizar estado del rollo:', err);
      toast.error('Error al actualizar el estado del rollo.');
    }
  };

  const getRollStatusSelectClass = (status?: RollStatus) => {
    switch (status) {
      case 'READY_FOR_PICKUP':
        return '!bg-emerald-50/90 dark:!bg-emerald-950/50 !border-emerald-300 dark:!border-emerald-700 !text-emerald-700 dark:!text-emerald-300';
      case 'DELIVERED':
        return '!bg-purple-50/90 dark:!bg-purple-950/50 !border-purple-300 dark:!border-purple-700 !text-purple-700 dark:!text-purple-300';
      case 'IN_PREPARATION':
        return '!bg-amber-50/90 dark:!bg-amber-950/50 !border-amber-300 dark:!border-amber-700 !text-amber-700 dark:!text-amber-300';
      case 'REGISTERED':
      default:
        return '!bg-slate-50 dark:!bg-slate-800/90 !border-slate-300 dark:!border-slate-700 !text-slate-700 dark:!text-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/production')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Lotes de Producción</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir Sábana</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              <span>Editar Lote</span>
            </button>
          )}

          {canCreate && (
            <Button variant="secondary" size="cta" onClick={handleOpenAddRoll}>
              <Plus className="w-4 h-4" />
              <span>Agregar Rollo</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Sábana Header Sheet Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        {/* Cabecera Principal y KPIs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Producción Textil • Sábana de Control
              </span>
              {batch.trackingCode && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="text-slate-400 font-sans font-normal">Cód. Seguimiento:</span>
                    <strong>{batch.trackingCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(batch.trackingCode!);
                      toast.success(`Código de seguimiento [${batch.trackingCode}] copiado.`);
                    }}
                    className="px-2 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Copiar código de seguimiento"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>LOTE:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">{batch.batchNumber}</span>
            </h1>

            {/* Metadata pills */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-300 pt-1">
              {/* Proveedor / Cliente (Solo lectura) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
                <Truck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-semibold text-slate-500 dark:text-slate-400">Proveedor:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {batch.supplierName || 'Sin proveedor asignado'}
                </span>
              </div>

              {/* Máquina */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
                <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-semibold text-slate-500 dark:text-slate-400">Máquina:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {batch.machineCode ? `[${batch.machineCode}] ` : ''}
                  {batch.machineName || 'Sin asignar'}
                </span>
              </div>

              {/* Fecha Inicio */}
              {batch.startDate && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Inicio:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatLocalDate(batch.startDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rollos</span>
              <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">{totalRolls}</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Peso Total
              </span>
              <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {totalWeight.toFixed(2)} Kg
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Promedio
              </span>
              <span className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {avgWeight.toFixed(2)} Kg
              </span>
            </div>
          </div>
        </div>

        {/* Estado General del Lote: 2 Estados (Solicitud registrada / Terminado) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Estado General del Lote
              </span>
              <p className="text-[11px] text-slate-400">
                {batch.status === 'COMPLETED'
                  ? 'Todos los hilos y entregas de este lote han concluido con éxito.'
                  : 'Lote registrado con avances de tejido semanales en curso.'}
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleQuickUpdateStatus('REQUESTED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  batch.status !== 'COMPLETED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                } ${!canEdit ? 'cursor-default' : ''}`}
                title="Lote registrado"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Solicitud registrada</span>
              </button>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => handleQuickUpdateStatus('COMPLETED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  batch.status === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                } ${!canEdit ? 'cursor-default' : ''}`}
                title="Lote entregado y terminado"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terminado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notes / Despacho Banner */}
        {batch.notes && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Despacho / Notas: </span>
              <span>{batch.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2.5 Resumen de Avances y Notificaciones por Rollo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div className="p-4 rounded-3xl bg-slate-500/[0.06] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Registrados
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {registeredRollsCount} <span className="text-xs font-sans text-slate-400 font-semibold">{registeredRollsCount === 1 ? 'rollo' : 'rollos'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-amber-500/[0.07] border border-amber-500/20 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                En Preparación
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {prepRollsCount} <span className="text-xs font-sans text-slate-400 font-semibold">{prepRollsCount === 1 ? 'rollo' : 'rollos'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-500/[0.08] border border-emerald-500/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                Listo para Recojo
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {readyRollsCount} <span className="text-xs font-sans text-slate-400 font-semibold">{readyRollsCount === 1 ? 'rollo' : 'rollos'}</span>
              </span>
            </div>
          </div>
          {readyRollsCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
              ¡Avisar recojo!
            </span>
          )}
        </div>

        <div className="p-4 rounded-3xl bg-purple-500/[0.07] border border-purple-500/20 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                Entregados
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {deliveredRollsCount} <span className="text-xs font-sans text-slate-400 font-semibold">{deliveredRollsCount === 1 ? 'rollo' : 'rollos'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Roll Add Form (Barra rápida de ingreso) */}
      {canCreate && (
        <div className="relative z-20 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Ingreso Rápido de Rollo
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Flujo: Operario &rarr; Fecha &rarr; Hora
            </span>
          </div>

          <form onSubmit={handleQuickAddRoll} className="space-y-3.5">
            {/* Fila 1: N° Rollo e Inicio */}
            <div className="relative z-30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">
                  N° Rollo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickRollNumber}
                  onChange={(e) => setQuickRollNumber(e.target.value)}
                  placeholder="Ej. 718"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div className="md:col-span-4">
                <Select
                  label="Operario Inicio"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  options={operatorOptions}
                  value={quickStartOperator}
                  onChange={setQuickStartOperator}
                  placeholder="Seleccionar operario..."
                />
              </div>

              <div className="md:col-span-3">
                <DatePicker
                  label="Fecha Inicio"
                  value={quickStartDate}
                  onChange={setQuickStartDate}
                  placeholder="Fecha..."
                />
              </div>

              <div className="md:col-span-3">
                <TimePicker
                  label="Hora Inicio"
                  value={quickStartTime}
                  onChange={setQuickStartTime}
                  placeholder="HH:MM"
                  align="right"
                />
              </div>
            </div>

            {/* Fila 2: Término, Peso, Observaciones y Botón */}
            <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end pt-1">
              <div className="md:col-span-4">
                <Select
                  label="Operario Término"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  options={operatorOptions}
                  value={quickEndOperator}
                  onChange={setQuickEndOperator}
                  placeholder="Seleccionar operario..."
                />
              </div>

              <div className="md:col-span-2">
                <DatePicker
                  label="Fecha Término"
                  value={quickEndDate}
                  onChange={setQuickEndDate}
                  placeholder="Fecha..."
                />
              </div>

              <div className="md:col-span-2">
                <TimePicker
                  label="Hora Término"
                  value={quickEndTime}
                  onChange={setQuickEndTime}
                  placeholder="HH:MM"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">
                  Peso (Kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                  placeholder="21.65"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">
                  Observaciones
                </label>
                <input
                  type="text"
                  value={quickObservations}
                  onChange={(e) => setQuickObservations(e.target.value)}
                  placeholder="Incidencias / Calidad..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                />
              </div>

              <div className="md:col-span-1">
                <Button type="submit" variant="secondary" size="md" isLoading={isQuickAdding} className="w-full">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Añadir</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. Sábana Table (Mirror of paper document) */}
      {rolls.length === 0 ? (
        <div className="relative z-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No hay rollos registrados en este lote
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Utiliza la barra rápida superior o el botón "Agregar Rollo" para comenzar a cargar la sábana de producción.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <TableContainer
          className="relative z-10"
          maxBodyHeight="880px"
          footer={
            <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="uppercase tracking-wider">Total Acumulado ({totalRolls} rollos):</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                {totalWeight.toFixed(2)} Kg
                <span className="ml-3 font-sans font-medium text-slate-500 text-[11px]">
                  Promedio por rollo: {avgWeight.toFixed(2)} Kg
                </span>
              </span>
            </div>
          }
        >
          <Table>
            <TableHead>
              <Th>Rollo</Th>
              <Th>Estado</Th>
              <Th>Operario Inicio</Th>
              <Th>Fecha Inicio</Th>
              <Th>H. Inicio</Th>
              <Th>Operario Término</Th>
              <Th>Fecha Término</Th>
              <Th>H. Término</Th>
              <Th align="right">Peso (Kg)</Th>
              <Th>Observaciones</Th>
              <Th align="right" className="print:hidden">
                Acciones
              </Th>
            </TableHead>
            <TableBody>
              {rolls.map((roll) => (
                <Tr key={roll.id}>
                  {/* Rollo */}
                  <Td>
                    <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
                      {roll.rollNumber}
                    </span>
                  </Td>

                  {/* Estado del Rollo con componente Select */}
                  <Td className="min-w-[190px]">
                    <div className="w-44">
                      <Select
                        options={ROLL_STATUS_OPTIONS}
                        value={roll.status || 'REGISTERED'}
                        onChange={(val) => handleUpdateRollStatus(roll, val as RollStatus)}
                        disabled={!canEdit}
                        className={`!py-1.5 !px-3 !text-xs !rounded-xl font-bold shadow-xs ${getRollStatusSelectClass(
                          roll.status
                        )}`}
                      />
                    </div>
                  </Td>

                  {/* Operario Inicio */}
                  <Td className="font-bold text-slate-800 dark:text-slate-200">{roll.startOperator || '-'}</Td>

                  {/* Fecha Inicio */}
                  <Td className="font-mono text-slate-700 dark:text-slate-300">{formatLocalDate(roll.startDate)}</Td>

                  {/* H. Inicio */}
                  <Td className="font-mono text-slate-600 dark:text-slate-400">{roll.startTime || '-'}</Td>

                  {/* Operario Término */}
                  <Td className="font-bold text-slate-800 dark:text-slate-200">{roll.endOperator || '-'}</Td>

                  {/* Fecha Término */}
                  <Td className="font-mono text-slate-700 dark:text-slate-300">{formatLocalDate(roll.endDate)}</Td>

                  {/* H. Término */}
                  <Td className="font-mono text-slate-600 dark:text-slate-400">{roll.endTime || '-'}</Td>

                  {/* Peso */}
                  <Td align="right" className="font-mono font-bold text-slate-900 dark:text-white">
                    {roll.weight !== null && roll.weight !== undefined ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                        {roll.weight.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">-</span>
                    )}
                  </Td>

                  {/* Observaciones */}
                  <Td className="text-slate-600 dark:text-slate-300">
                    {roll.observations ? (
                      <span
                        className={
                          roll.observations.toLowerCase().includes('despacho')
                            ? 'px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 font-bold text-[11px]'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        {roll.observations}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">-</span>
                    )}
                  </Td>

                  {/* Acciones */}
                  <Td align="right" className="print:hidden">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Tooltip content="Editar rollo">
                          <button
                            onClick={() => handleOpenEditRoll(roll)}
                            className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip content="Eliminar rollo">
                          <button
                            onClick={() => handleDeleteRoll(roll)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modals */}
      <RollModal
        isOpen={isRollModalOpen}
        onClose={() => setIsRollModalOpen(false)}
        onSave={handleSaveRoll}
        editingRoll={editingRoll}
        suggestedRollNumber={String((rolls[rolls.length - 1] ? parseInt(rolls[rolls.length - 1].rollNumber, 10) + 1 : 1) || '')}
      />

      <ProductionBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSave={handleSaveBatchHeader}
        editingBatch={batch}
      />
    </div>
  );
};
