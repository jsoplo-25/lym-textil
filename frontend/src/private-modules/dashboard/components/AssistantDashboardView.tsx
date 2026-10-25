import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  PackageCheck,
  Factory,
  Truck,
  ArrowUpRight,
  Clock,
  Search,
  ExternalLink,
  Loader2,
  Building2,
  Sparkles,
  Check,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/dashboard.types';
import { DashboardStatCard } from './DashboardStatCard';
import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import { Skeleton } from '../../../shared/ui/Skeleton';

interface AssistantDashboardViewProps {
  data: DashboardMetrics | null;
  isLoading: boolean;
  onApproveRoll?: (rollId: string, rollNumber: string) => Promise<void>;
  approvingRollId?: string | null;
}

export const AssistantDashboardView: React.FC<AssistantDashboardViewProps> = ({
  data,
  isLoading,
  onApproveRoll,
  approvingRollId,
}) => {
  const navigate = useNavigate();
  const [searchTracking, setSearchTracking] = useState('');

  const stats = data?.stats;
  const pendingApprovals = data?.pendingApprovals || [];
  const readyForPickupRolls = data?.readyForPickupRolls || [];
  const activeBatches = data?.activeBatches || [];

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTracking.trim().toUpperCase();
    if (!query) return;

    // Check if it matches an active batch trackingCode or batchNumber
    const match = activeBatches.find(
      (b) => b.trackingCode.toUpperCase() === query || b.batchNumber.toUpperCase() === query
    );
    if (match) {
      navigate(`/production/${match.id}`);
    } else {
      navigate(`/production?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Buscador rápido y Atajo de Seguimiento */}
      <Card variant="glass" padding="md" className="bg-primary-500/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>Coordinación Operativa y Mesa de Despacho</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aprueba rollos en tiempo real, verifica lotes y gestiona entregas a proveedores
            </p>
          </div>

          <form onSubmit={handleSearchTracking} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                placeholder="N° Lote o Cód. Seguimiento..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-primary-600 dark:hover:bg-primary-500 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>
      </Card>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardStatCard
          title="Rollos por Aprobar"
          value={isLoading ? '-' : stats?.rollsByStatus.readyForApproval ?? 0}
          subtitle={
            (stats?.rollsByStatus.readyForApproval ?? 0) > 0
              ? 'Rollos esperando tu visto bueno'
              : 'Todo aprobado y al día'
          }
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBg={
            (stats?.rollsByStatus.readyForApproval ?? 0) > 0
              ? 'bg-accent-500/20'
              : 'bg-primary-500/15'
          }
          iconColor={
            (stats?.rollsByStatus.readyForApproval ?? 0) > 0
              ? 'text-accent-600 dark:text-accent-400'
              : 'text-primary-600 dark:text-primary-400'
          }
          badge={{
            text:
              (stats?.rollsByStatus.readyForApproval ?? 0) > 0
                ? 'Acción requerida'
                : 'Al día',
            variant:
              (stats?.rollsByStatus.readyForApproval ?? 0) > 0 ? 'amber' : 'emerald',
          }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Listos para Recojo"
          value={isLoading ? '-' : stats?.rollsByStatus.readyForPickup ?? 0}
          subtitle="Rollos aprobados para retiro del cliente"
          icon={<PackageCheck className="w-6 h-6" />}
          iconBg="bg-primary-500/15"
          iconColor="text-primary-600 dark:text-primary-400"
          badge={{ text: 'Para Entrega', variant: 'emerald' }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Lotes Activos"
          value={isLoading ? '-' : stats?.activeBatches ?? 0}
          subtitle={`${stats?.completedBatches ?? 0} lotes concluidos exitosamente`}
          icon={<Factory className="w-6 h-6" />}
          iconBg="bg-blue-500/15"
          iconColor="text-blue-600 dark:text-blue-400"
          badge={{ text: 'En Tejeduría', variant: 'blue' }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Clientes / Proveedores"
          value={isLoading ? '-' : stats?.totalSuppliers ?? 0}
          subtitle="Proveedores registrados en el sistema"
          icon={<Building2 className="w-6 h-6" />}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-600 dark:text-purple-400"
          badge={{ text: 'Hilado & Clientes', variant: 'purple' }}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna Izquierda: Mesa de Aprobación Inmediata (3 columnas) */}
        <div className="lg:col-span-3 space-y-6">
          <Card variant="glass" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent-500" />
                  <span>Mesa de Aprobación de Rollos</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Revisa y aprueba rollos pesados por los tejedores para habilitar su recojo
                </p>
              </div>
              <Badge variant={pendingApprovals.length > 0 ? 'amber' : 'emerald'} size="sm">
                {pendingApprovals.length} por aprobar
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-primary-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No hay rollos pendientes de aprobación
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  ¡Excelente trabajo! Todos los rollos enviados por el equipo de tejeduría han sido
                  aprobados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((roll) => (
                  <div
                    key={roll.rollId}
                    className="p-4 rounded-2xl bg-accent-50/60 dark:bg-accent-950/20 border border-accent-200/80 dark:border-accent-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent-400 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-black text-accent-800 dark:text-accent-200">
                          Rollo #{roll.rollNumber}
                        </span>
                        <NavLink
                          to={`/production/${roll.batchId}`}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-primary-600 flex items-center gap-1"
                          title="Abrir sábana del lote"
                        >
                          <span>{roll.batchNumber}</span>
                          <ExternalLink className="w-3 h-3" />
                        </NavLink>
                        {roll.weight && (
                          <span className="font-mono text-xs font-black text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded bg-primary-500/10">
                            {roll.weight} kg
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Cliente:</strong> {roll.supplierName}{' '}
                        {roll.machineName && (
                          <span className="text-slate-400">({roll.machineName})</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Registrado:{' '}
                        {new Date(roll.createdAt).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {onApproveRoll && (
                      <button
                        type="button"
                        disabled={approvingRollId === roll.rollId}
                        onClick={() => onApproveRoll(roll.rollId, roll.rollNumber)}
                        className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-md shadow-primary-600/20 shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {approvingRollId === roll.rollId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Aprobar Visto Bueno</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Lotes de Producción en Curso */}
          <Card variant="glass" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-500" />
                  <span>Avance de Lotes Activos</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Progreso de entregas por orden de trabajo
                </p>
              </div>
              <NavLink
                to="/production"
                className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="space-y-3">
              {activeBatches.map((batch) => (
                <NavLink
                  key={batch.id}
                  to={`/production/${batch.id}`}
                  className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-primary-500/5 hover:border-primary-500/20 border border-transparent transition-all group"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300">
                        {batch.batchNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate min-w-0 max-w-[10rem] min-[400px]:max-w-[14rem] sm:max-w-sm">
                        {batch.supplierName || 'Cliente General'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-primary-600 dark:text-primary-400 shrink-0">
                      {batch.progressPercent}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${batch.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-slate-400">
                    <span>
                      {batch.deliveredRolls} de {batch.totalRolls} rollos entregados
                    </span>
                    {batch.trackingCode && (
                      <span className="font-mono text-[10px] text-slate-500">
                        Cód: {batch.trackingCode}
                      </span>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Rollos Listos para Recojo y Proveedores (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-primary-500" />
                  <span>Listos para Recojo</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rollos aprobados esperando recojo del cliente
                </p>
              </div>
              <Badge variant="emerald" size="sm">
                {readyForPickupRolls.length}
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            ) : readyForPickupRolls.length === 0 ? (
              <div className="py-6 text-center">
                <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No hay rollos en espera de recojo
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Los rollos aprobados aparecerán aquí cuando estén listos.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {readyForPickupRolls.map((roll) => (
                  <div
                    key={roll.rollId}
                    className="p-3 rounded-2xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-500/20 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-primary-800 dark:text-primary-200">
                          Rollo #{roll.rollNumber}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {roll.batchNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {roll.supplierName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-primary-600 dark:text-primary-400 block">
                        {roll.weight ? `${roll.weight} kg` : '-'}
                      </span>
                      <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                        Listo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Atajos de Gestión */}
          <Card variant="glass" padding="lg">
            <h3 className="font-black text-slate-900 dark:text-white text-sm mb-3">
              Atajos Operativos
            </h3>
            <div className="space-y-2">
              <NavLink
                to="/production"
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-500/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span>Gestión de Sábanas de Producción</span>
                <ArrowUpRight className="w-4 h-4 text-primary-500 shrink-0" />
              </NavLink>
              <NavLink
                to="/suppliers"
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-500/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span>Directorio de Clientes / Proveedores</span>
                <ArrowUpRight className="w-4 h-4 text-primary-500 shrink-0" />
              </NavLink>
              <NavLink
                to="/machines"
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-500/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span>Control de Maquinarias Textil</span>
                <ArrowUpRight className="w-4 h-4 text-primary-500 shrink-0" />
              </NavLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
