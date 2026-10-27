import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
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
import { formatLocalDate, getTodayLocalDate, toDatePickerValue } from '../../../shared/lib/utils';
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
  const canApprove = hasPermission(sessionUser, 'production:approve');

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
  const lastQuickDefaultKeyRef = useRef<string | null | undefined>(undefined);

  // Row and action loaders
  const [updatingRollId, setUpdatingRollId] = useState<string | null>(null);
  const [approvingRollId, setApprovingRollId] = useState<string | null>(null);
  const [deletingRollId, setDeletingRollId] = useState<string | null>(null);
  const [isUpdatingBatchStatus, setIsUpdatingBatchStatus] = useState(false);

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

        const latestBatchRoll = data.rolls?.[data.rolls.length - 1];
        const latestRollKey = latestBatchRoll
          ? `${latestBatchRoll.id}|${latestBatchRoll.endOperator || ''}|${latestBatchRoll.endDate || ''}|${latestBatchRoll.endTime || ''}`
          : null;

        if (lastQuickDefaultKeyRef.current !== latestRollKey) {
          lastQuickDefaultKeyRef.current = latestRollKey;
          if (latestBatchRoll?.endDate && latestBatchRoll.endTime) {
            setQuickStartOperator(latestBatchRoll.endOperator || '');
            setQuickStartDate(toDatePickerValue(latestBatchRoll.endDate));
            setQuickStartTime(latestBatchRoll.endTime);
          } else {
            setQuickStartOperator('');
            setQuickStartDate(getTodayLocalDate());
            setQuickStartTime('');
          }
        }
      }
    } catch (err) {
      console.error('Error cargando detalle del lote:', err);
      toast.error('Error al cargar la sábana de producción.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    lastQuickDefaultKeyRef.current = undefined;
    loadOperators();
    loadBatch();
    setQuickStartDate(getTodayLocalDate());
    setQuickEndDate(getTodayLocalDate());

    const handleRollsUpdated = () => {
      loadBatch();
    };
    window.addEventListener('production:rolls-updated', handleRollsUpdated);
    return () => window.removeEventListener('production:rolls-updated', handleRollsUpdated);
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
    window.dispatchEvent(new CustomEvent('production:rolls-updated'));
  };

  const handleDeleteRoll = async (roll: ProductionRoll) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rollo N° ${roll.rollNumber}?`)) {
      return;
    }
    try {
      setDeletingRollId(roll.id);
      await productionService.deleteRoll(roll.id);
      toast.success(`Rollo N° ${roll.rollNumber} eliminado.`);
      await loadBatch();
      window.dispatchEvent(new CustomEvent('production:rolls-updated'));
    } catch (err) {
      console.error('Error eliminando rollo:', err);
      toast.error('Error al eliminar el rollo.');
    } finally {
      setDeletingRollId(null);
    }
  };

  const handleQuickAddRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!quickRollNumber.trim()) {
      toast.error('Ingresa el número de rollo.');
      return;
    }

    const effectiveStartDate = quickStartDate.trim() || getTodayLocalDate();
    const effectiveStartTime = quickStartTime.trim() || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (!quickStartOperator.trim()) {
      toast.error('Selecciona o ingresa el operario de inicio.');
      return;
    }

    try {
      setIsQuickAdding(true);
      const payload: CreateRollDTO = {
        rollNumber: quickRollNumber.trim(),
        startDate: effectiveStartDate,
        startTime: effectiveStartTime,
        startOperator: quickStartOperator.trim(),
        endDate: quickEndDate.trim() || undefined,
        endTime: quickEndTime.trim() || undefined,
        endOperator: quickEndOperator.trim() || undefined,
        weight: quickWeight.trim() !== '' ? parseFloat(quickWeight) : undefined,
        status: 'REGISTERED',
        observations: quickObservations.trim() || undefined,
      };

      await productionService.addRoll(id, payload);
      toast.success(`Rollo N° ${quickRollNumber} registrado.`);

      // Limpiar campos del formulario tras registro exitoso
      const parsedNum = parseInt(quickRollNumber, 10);
      if (!isNaN(parsedNum)) {
        setQuickRollNumber(String(parsedNum + 1));
      } else {
        setQuickRollNumber('');
      }
      setQuickWeight('');
      setQuickObservations('');
      setQuickStartTime('');
      setQuickEndTime('');
      setQuickStartOperator('');
      setQuickEndOperator('');
      setQuickStartDate(getTodayLocalDate());
      setQuickEndDate(getTodayLocalDate());

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
  const latestRoll = rolls[rolls.length - 1];
  const hasLatestRollEnd = Boolean(latestRoll?.endDate && latestRoll?.endTime);
  const totalRolls = rolls.length;
  const totalWeight = rolls.reduce((sum, r) => sum + (r.weight || 0), 0);
  const avgWeight = totalRolls > 0 ? totalWeight / totalRolls : 0;
  const registeredRollsCount = rolls.filter((r) => !r.status || r.status === 'REGISTERED').length;
  const prepRollsCount = rolls.filter((r) => r.status === 'IN_PREPARATION').length;
  const readyApprovalRollsCount = rolls.filter((r) => r.status === 'READY_FOR_APPROVAL').length;
  const readyRollsCount = rolls.filter((r) => r.status === 'READY_FOR_PICKUP').length;
  const deliveredRollsCount = rolls.filter((r) => r.status === 'DELIVERED').length;

  const handleQuickUpdateStatus = async (newStatus: BatchStatus) => {
    if (!id || !canEdit || !batch) return;
    if (batch.status === newStatus) return;

    if (newStatus === 'COMPLETED') {
      if (totalRolls === 0) {
        toast.error('No se puede marcar el lote como Terminado porque aún no tiene rollos registrados.');
        return;
      }
      const pendingCount = totalRolls - deliveredRollsCount;
      if (pendingCount > 0) {
        toast.error(
          `No se puede marcar el lote como Terminado: faltan ${pendingCount} ${
            pendingCount === 1 ? 'rollo' : 'rollos'
          } por entregar. Todos los rollos deben estar en estado "Entregado".`
        );
        return;
      }
    }

    try {
      setIsUpdatingBatchStatus(true);
      await productionService.updateBatch(id, { status: newStatus });
      toast.success(
        newStatus === 'COMPLETED'
          ? 'Lote marcado como Terminado (todos los rollos entregados).'
          : 'Lote marcado como Solicitud registrada.'
      );
      await loadBatch();
      window.dispatchEvent(new CustomEvent('production:rolls-updated'));
    } catch (err: unknown) {
      console.error('Error actualizando estado:', err);
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiError || 'Error al actualizar el estado del lote.');
    } finally {
      setIsUpdatingBatchStatus(false);
    }
  };

  // Aprobación directa por parte del Asistente o Administrador
  const handleApproveRollDirectly = async (roll: ProductionRoll) => {
    try {
      setApprovingRollId(roll.id);
      const res = await productionService.approveRoll(roll.id);
      toast.success(res.message || `Rollo N° ${roll.rollNumber} aprobado y listo para recojo.`);
      await loadBatch();
      window.dispatchEvent(new CustomEvent('production:rolls-updated'));
    } catch (err: unknown) {
      console.error('Error al aprobar rollo:', err);
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiError || 'Error al aprobar el rollo.');
    } finally {
      setApprovingRollId(null);
    }
  };

  // Cambio rápido del estado de un rollo con avance progresivo
  const handleUpdateRollStatus = async (roll: ProductionRoll, newStatus: RollStatus) => {
    if (!id || !canEdit) return;
    if (roll.status === newStatus) return;

    // 1. Validaciones para el Tejedor (no aprobador):
    if (!canApprove) {
      if (roll.status === 'DELIVERED') {
        toast.error('Este rollo ya fue entregado y no puede ser modificado por el tejedor.');
        return;
      }
      if (roll.status === 'READY_FOR_APPROVAL') {
        toast.error('El rollo ya está en espera de visto bueno y no puede modificarse hasta que administración lo apruebe.');
        return;
      }
      if (roll.status === 'READY_FOR_PICKUP') {
        // En Listo para recojo, el tejedor solo puede pasarlo a Entregado al recoger el proveedor
        if (newStatus !== 'READY_FOR_PICKUP' && newStatus !== 'DELIVERED') {
          toast.error('El rollo listo para recojo solo puede ser marcado como "Entregado".');
          return;
        }
      } else {
        if (newStatus === 'READY_FOR_PICKUP') {
          toast.error('El rollo debe ser aprobado por el Asistente o Administrador antes de pasar a "Listo para recojo".');
          return;
        }
        if (newStatus === 'DELIVERED') {
          toast.error('El rollo debe estar aprobado y en "Listo para recojo" antes de poder ser entregado.');
          return;
        }
      }
      if (roll.status === 'IN_PREPARATION' && newStatus === 'REGISTERED') {
        toast.error('No se puede retroceder un rollo en preparación a estado registrado.');
        return;
      }
    } else {
      // 2. Validaciones para Asistente / Administrador:
      if (newStatus === 'READY_FOR_PICKUP' && roll.status !== 'READY_FOR_PICKUP') {
        toast.error('Para pasar el rollo a "Listo para recojo", haz clic en el botón "Aprobar".');
        return;
      }
    }

    try {
      setUpdatingRollId(roll.id);
      await productionService.updateRoll(roll.id, { status: newStatus });
      if (newStatus === 'READY_FOR_APPROVAL') {
        toast.success(`Rollo N° ${roll.rollNumber} listo para aprobar. Se notificó al Asistente y Administrador.`);
      } else if (newStatus === 'READY_FOR_PICKUP') {
        toast.success(`¡Rollo N° ${roll.rollNumber} aprobado y listo para recojo!`);
      } else if (newStatus === 'DELIVERED') {
        toast.success(`Rollo N° ${roll.rollNumber} marcado como entregado.`);
      } else if (newStatus === 'IN_PREPARATION') {
        toast.success(`Rollo N° ${roll.rollNumber} en preparación.`);
      } else {
        toast.success(`Rollo N° ${roll.rollNumber} marcado como registrado.`);
      }
      await loadBatch();
      window.dispatchEvent(new CustomEvent('production:rolls-updated'));
    } catch (err: unknown) {
      console.error('Error al actualizar estado del rollo:', err);
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiError || 'Error al actualizar el estado del rollo.');
    } finally {
      setUpdatingRollId(null);
    }
  };

  // Opciones disponibles según rol y avance progresivo
  const getRollAvailableOptions = (roll: ProductionRoll) => {
    const current = roll.status || 'REGISTERED';

    // Para Asistente Administrativo o Administrador:
    if (canApprove) {
      return ROLL_STATUS_OPTIONS.filter((opt) => {
        if (opt.value === 'READY_FOR_APPROVAL') return false;
        // "Listo para recojo" solo se ve si ya fue aprobado
        if (opt.value === 'READY_FOR_PICKUP') {
          return current === 'READY_FOR_PICKUP';
        }
        return true; // REGISTERED, IN_PREPARATION, DELIVERED
      });
    }

    // Para el rol Tejedor (avance progresivo hacia entrega):
    if (current === 'DELIVERED') {
      return ROLL_STATUS_OPTIONS.filter((opt) => opt.value === 'DELIVERED');
    }
    if (current === 'READY_FOR_PICKUP') {
      // El tejedor ve "Listo para recojo" y puede pasarlo a "Entregado" cuando el proveedor recoge los rollos
      return ROLL_STATUS_OPTIONS.filter(
        (opt) => opt.value === 'READY_FOR_PICKUP' || opt.value === 'DELIVERED'
      );
    }
    if (current === 'READY_FOR_APPROVAL') {
      return ROLL_STATUS_OPTIONS.filter((opt) => opt.value === 'READY_FOR_APPROVAL');
    }
    if (current === 'IN_PREPARATION') {
      return ROLL_STATUS_OPTIONS.filter(
        (opt) => opt.value === 'IN_PREPARATION' || opt.value === 'READY_FOR_APPROVAL'
      );
    }
    return ROLL_STATUS_OPTIONS.filter(
      (opt) =>
        opt.value === 'REGISTERED' ||
        opt.value === 'IN_PREPARATION' ||
        opt.value === 'READY_FOR_APPROVAL'
    );
  };

  const isPaused = batch?.status === 'PAUSED';
  const latestPauseLog = isPaused && batch?.statusLogs && batch.statusLogs.length > 0
    ? batch.statusLogs.find((l) => l.status === 'PAUSED')
    : null;

  const isRollSelectDisabled = (roll: ProductionRoll) => {
    if (isPaused) return true;
    if (!canEdit) return true;
    if (!canApprove) {
      if (roll.status === 'DELIVERED' || roll.status === 'READY_FOR_APPROVAL') {
        return true;
      }
    }
    return false;
  };

  const getRollSelectTooltip = (roll: ProductionRoll) => {
    if (isPaused) {
      return 'El lote se encuentra PAUSADO. La gestión de rollos está bloqueada.';
    }
    if (updatingRollId === roll.id) {
      return 'Actualizando estado del rollo...';
    }
    if (!canEdit) {
      return 'No tienes permisos para modificar el estado del rollo.';
    }
    if (!canApprove) {
      if (roll.status === 'DELIVERED') {
        return 'Este rollo ya fue entregado y no puede ser modificado por el tejedor.';
      }
      if (roll.status === 'READY_FOR_APPROVAL') {
        return 'Rollo enviado a visto bueno. Esperando aprobación de administración.';
      }
    }
    return '';
  };

  const getRollStatusSelectClass = (status?: RollStatus) => {
    switch (status) {
      case 'READY_FOR_APPROVAL':
        return '!bg-accent-100/90 dark:!bg-accent-950/60 !border-accent-400 dark:!border-accent-600 !text-accent-800 dark:!text-accent-300 font-extrabold';
      case 'READY_FOR_PICKUP':
        return '!bg-primary-50/90 dark:!bg-primary-950/50 !border-primary-300 dark:!border-primary-700 !text-primary-700 dark:!text-primary-300';
      case 'DELIVERED':
        return '!bg-purple-50/90 dark:!bg-purple-950/50 !border-purple-300 dark:!border-purple-700 !text-purple-700 dark:!text-purple-300';
      case 'IN_PREPARATION':
        return '!bg-blue-50/90 dark:!bg-blue-950/50 !border-blue-300 dark:!border-blue-700 !text-blue-700 dark:!text-blue-300';
      case 'REGISTERED':
      default:
        return '!bg-slate-50 dark:!bg-slate-800/90 !border-slate-300 dark:!border-slate-700 !text-slate-700 dark:!text-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top indeterminate loader when refreshing/updating data */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[999] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-primary-500 w-full animate-pulse" />
        </div>
      )}

      {/* Banner de Lote Pausado */}
      {isPaused && (
        <div className="p-4 rounded-2xl bg-accent-500/10 border-2 border-accent-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-accent-800 dark:text-accent-300 shadow-sm print:hidden">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-accent-500/20 text-accent-600 dark:text-accent-400 font-bold shrink-0">
              ⏸️
            </span>
            <div>
              <p className="font-extrabold text-sm">
                LOTE PAUSADO — Producción y registro de rollos temporalmente detenidos
              </p>
              {latestPauseLog?.notes && (
                <p className="text-xs text-accent-700 dark:text-accent-400/90 mt-0.5">
                  <span className="font-semibold">Motivo:</span> {latestPauseLog.notes}
                  {latestPauseLog.changedByUser && (
                    <span className="opacity-80"> • Pausado por: {latestPauseLog.changedByUser.firstName} {latestPauseLog.changedByUser.lastName}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Reanudar Lote
            </button>
          )}
        </div>
      )}

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
            <Button
              variant="secondary"
              size="cta"
              disabled={isPaused}
              onClick={handleOpenAddRoll}
              title={isPaused ? 'El lote se encuentra pausado. Reanúdalo para añadir rollos.' : undefined}
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Rollo</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Sábana Header Sheet Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        {/* Cabecera Principal y KPIs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                Producción Textil • Sábana de Control
              </span>
              {batch.trackingCode && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-500/20 flex items-center gap-1.5">
                    <span className="text-slate-400 font-sans font-normal">Cód. Seguimiento:</span>
                    <strong>{batch.trackingCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(batch.trackingCode!);
                      toast.success(`Código de seguimiento [${batch.trackingCode}] copiado.`);
                    }}
                    className="px-2 py-1 rounded-lg text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Copiar código de seguimiento"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center flex-wrap gap-x-3 break-all min-w-0">
              <span>LOTE:</span>
              <span className="text-primary-600 dark:text-primary-400 font-mono">{batch.batchNumber}</span>
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
            <div className="px-4 py-2.5 rounded-2xl bg-primary-500/10 border border-primary-500/20">
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider block">
                Peso Total
              </span>
              <span className="text-xl font-extrabold font-mono text-primary-600 dark:text-primary-400">
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
                disabled={!canEdit || isUpdatingBatchStatus}
                onClick={() => handleQuickUpdateStatus('REQUESTED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  batch.status !== 'COMPLETED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                } ${!canEdit || isUpdatingBatchStatus ? 'cursor-default opacity-60' : ''}`}
                title="Lote registrado"
              >
                {isUpdatingBatchStatus && batch.status !== 'COMPLETED' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                <span>Solicitud registrada</span>
              </button>

              <Tooltip
                content={
                  batch.status === 'COMPLETED'
                    ? 'Lote terminado (todos los rollos entregados).'
                    : totalRolls === 0
                    ? 'No se puede terminar: registra rollos antes de finalizar el lote.'
                    : deliveredRollsCount < totalRolls
                    ? `No se puede terminar: faltan ${totalRolls - deliveredRollsCount} ${
                        totalRolls - deliveredRollsCount === 1 ? 'rollo' : 'rollos'
                      } por entregar.`
                    : 'Marcar lote como terminado'
                }
                position="top"
              >
                <button
                  type="button"
                  disabled={!canEdit || isUpdatingBatchStatus}
                  onClick={() => handleQuickUpdateStatus('COMPLETED')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    batch.status === 'COMPLETED'
                      ? 'bg-primary-600 text-white shadow-xs'
                      : deliveredRollsCount < totalRolls || totalRolls === 0
                      ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      : 'text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40'
                  } ${!canEdit || isUpdatingBatchStatus ? 'cursor-default opacity-60' : ''}`}
                >
                  {isUpdatingBatchStatus && batch.status === 'COMPLETED' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Terminado</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Notes / Despacho Banner */}
        {batch.notes && (
          <div className="p-3.5 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-start gap-2.5 text-xs text-accent-900 dark:text-accent-200">
            <FileText className="w-4 h-4 text-accent-600 dark:text-accent-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Despacho / Notas: </span>
              <span>{batch.notes}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2.5 Resumen de Avances y Notificaciones por Rollo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 print:hidden">
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

        <div className="p-4 rounded-3xl bg-blue-500/[0.07] border border-blue-500/20 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                En Preparación
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {prepRollsCount} <span className="text-xs font-sans text-slate-400 font-semibold">{prepRollsCount === 1 ? 'rollo' : 'rollos'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-accent-500/[0.08] border border-accent-500/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-500/20 text-accent-700 dark:text-accent-300 flex items-center justify-center font-bold shadow-xs">
              <AlertCircle className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider block">
                Por Aprobar
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {readyApprovalRollsCount}{' '}
                <span className="text-xs font-sans text-slate-400 font-semibold">
                  {readyApprovalRollsCount === 1 ? 'rollo' : 'rollos'}
                </span>
              </span>
            </div>
          </div>
          {readyApprovalRollsCount > 0 && (
            <span className="px-2 py-0.5 rounded-xl bg-accent-600 text-white text-[10px] font-extrabold shadow-xs animate-pulse">
              ¡Revisar!
            </span>
          )}
        </div>

        <div className="p-4 rounded-3xl bg-primary-500/[0.08] border border-primary-500/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider block">
                Listo para Recojo
              </span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {readyRollsCount} <span className="text-xs font-sans text-slate-400 font-semibold">{readyRollsCount === 1 ? 'rollo' : 'rollos'}</span>
              </span>
            </div>
          </div>
          {readyRollsCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-primary-600 text-white text-[10px] font-extrabold shadow-xs">
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
        <div className="relative z-20 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  N° Rollo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickRollNumber}
                  onChange={(e) => setQuickRollNumber(e.target.value)}
                  placeholder="Ej. 718"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs"
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Peso (Kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickWeight}
                  onChange={(e) => setQuickWeight(e.target.value)}
                  placeholder="21.65"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Observaciones
                </label>
                <input
                  type="text"
                  value={quickObservations}
                  onChange={(e) => setQuickObservations(e.target.value)}
                  placeholder="Incidencias / Calidad..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs"
                />
              </div>

              <div className="md:col-span-1">
                <Button type="submit" variant="secondary" size="md" isLoading={isQuickAdding} className="w-full">
                  {!isQuickAdding && <Plus className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{isQuickAdding ? 'Guardando...' : 'Añadir'}</span>
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
            <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="uppercase tracking-wider">Total Acumulado ({totalRolls} rollos):</span>
              <span className="font-mono text-primary-600 dark:text-primary-400 text-sm">
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
                  <Td className="min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <Tooltip content={getRollSelectTooltip(roll)}>
                        <div className="w-40 sm:w-44 relative">
                          <Select
                            options={getRollAvailableOptions(roll)}
                            value={roll.status || 'REGISTERED'}
                            onChange={(val) => handleUpdateRollStatus(roll, val as RollStatus)}
                            disabled={isRollSelectDisabled(roll) || updatingRollId === roll.id}
                            className={`!py-1.5 !px-3 !text-xs !rounded-xl font-bold shadow-xs ${getRollStatusSelectClass(
                              roll.status
                            )} ${updatingRollId === roll.id ? 'opacity-60' : ''}`}
                          />
                          {updatingRollId === roll.id && (
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600 dark:text-primary-400" />
                            </div>
                          )}
                        </div>
                      </Tooltip>
                      {canApprove && roll.status === 'READY_FOR_APPROVAL' && (
                        <Tooltip content="Aprobar rollo y pasar a Listo para recojo">
                          <button
                            type="button"
                            disabled={approvingRollId === roll.id}
                            onClick={() => handleApproveRollDirectly(roll)}
                            className="px-2.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-[11px] shadow-sm shadow-primary-600/30 transition-all cursor-pointer flex items-center gap-1 shrink-0 animate-pulse hover:animate-none disabled:opacity-50"
                          >
                            {approvingRollId === roll.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{approvingRollId === roll.id ? 'Aprobando...' : 'Aprobar'}</span>
                          </button>
                        </Tooltip>
                      )}
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
                      <span className="text-primary-600 dark:text-primary-400 text-xs">
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
                            ? 'px-2 py-0.5 rounded-md bg-accent-400/20 text-accent-800 dark:text-accent-300 font-bold text-[11px]'
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
                        <Tooltip content={isPaused ? 'Lote pausado: no se pueden editar rollos' : 'Editar rollo'}>
                          <button
                            disabled={isPaused}
                            onClick={() => handleOpenEditRoll(roll)}
                            className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      {canDelete && (canApprove || (roll.status !== 'READY_FOR_PICKUP' && roll.status !== 'DELIVERED')) && (
                        <Tooltip content={isPaused ? 'Lote pausado: no se pueden eliminar rollos' : 'Eliminar rollo'}>
                          <button
                            onClick={() => handleDeleteRoll(roll)}
                            disabled={isPaused || deletingRollId === roll.id}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deletingRollId === roll.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
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
        suggestedStartOperator={hasLatestRollEnd ? latestRoll.endOperator || undefined : undefined}
        suggestedStartDate={hasLatestRollEnd ? toDatePickerValue(latestRoll.endDate) : undefined}
        suggestedStartTime={hasLatestRollEnd ? latestRoll.endTime || undefined : undefined}
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
