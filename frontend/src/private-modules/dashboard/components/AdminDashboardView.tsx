import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Layers,
  Factory,
  Cog,
  Users,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Check,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/dashboard.types';
import { DashboardStatCard } from './DashboardStatCard';
import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import { Avatar } from '../../../shared/ui/Avatar';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { getRoleDisplayName } from '../../../shared/lib/roles';

interface AdminDashboardViewProps {
  data: DashboardMetrics | null;
  isLoading: boolean;
  onApproveRoll?: (rollId: string, rollNumber: string) => Promise<void>;
  approvingRollId?: string | null;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  data,
  isLoading,
  onApproveRoll,
  approvingRollId,
}) => {
  const stats = data?.stats;
  const system = data?.system;
  const pendingApprovals = data?.pendingApprovals || [];
  const activeBatches = data?.activeBatches || [];

  const machineAvailability =
    stats && stats.machines.total > 0
      ? Math.round((stats.machines.operational / stats.machines.total) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* 1. Alerta prioritaria si hay rollos por aprobar */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Rollos esperando visto bueno</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
                  {pendingApprovals.length}
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hay rollos de tejido pesados que requieren aprobación para pasar a Listo para Recojo.
              </p>
            </div>
          </div>
          <NavLink
            to="/production"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Ver en Producción</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      )}

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardStatCard
          title="Producción Total"
          value={isLoading ? '-' : `${stats?.totalWeightKg.toLocaleString()} kg`}
          subtitle={isLoading ? undefined : `${stats?.totalRolls ?? 0} rollos fabricados en total`}
          icon={<Layers className="w-6 h-6" />}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-600 dark:text-emerald-400"
          badge={{ text: 'Acumulado', variant: 'emerald' }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Lotes en Proceso"
          value={isLoading ? '-' : stats?.activeBatches ?? 0}
          subtitle={isLoading ? undefined : `${stats?.completedBatches ?? 0} lotes completados`}
          icon={<Factory className="w-6 h-6" />}
          iconBg="bg-blue-500/15"
          iconColor="text-blue-600 dark:text-blue-400"
          badge={{ text: 'Activos', variant: 'blue' }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Disponibilidad Planta"
          value={isLoading ? '-' : `${machineAvailability}%`}
          subtitle={
            isLoading
              ? undefined
              : `${stats?.machines.operational ?? 0} operativas • ${stats?.machines.maintenance ?? 0} en mantenimiento`
          }
          icon={<Cog className="w-6 h-6" />}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-600 dark:text-purple-400"
          badge={{
            text: `${stats?.machines.total ?? 0} Máquinas`,
            variant: stats?.machines.maintenance ? 'amber' : 'purple',
          }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Usuarios del Sistema"
          value={isLoading ? '-' : system?.totalUsers ?? 0}
          subtitle={
            isLoading
              ? undefined
              : `${system?.totalRoles ?? 0} roles configurados (${system?.systemRoles ?? 0} nativos)`
          }
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-slate-900/10 dark:bg-white/10"
          iconColor="text-slate-700 dark:text-slate-200"
          badge={{ text: 'Seguridad', variant: 'slate' }}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna Izquierda / Central: Lotes Activos y Salud de Planta (3 columnas) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lotes de Producción Activos */}
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Lotes de Producción Activos</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Órdenes con sábana de rollos actualmente en tejido o despacho
                </p>
              </div>
              <NavLink
                to="/production"
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : activeBatches.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No hay lotes en curso en este momento
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Todos los lotes registrados han sido concluidos o no hay órdenes activas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBatches.map((batch) => (
                  <NavLink
                    key={batch.id}
                    to={`/production/${batch.id}`}
                    className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-500/5 hover:border-emerald-500/20 border border-transparent transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {batch.batchNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-sm">
                          {batch.supplierName || 'Cliente General'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {batch.machineName && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {batch.machineName}
                          </span>
                        )}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>
                        Avance de entrega: <strong>{batch.deliveredRolls}</strong> de{' '}
                        <strong>{batch.totalRolls}</strong> rollos
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {batch.progressPercent}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${batch.progressPercent}%` }}
                      />
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
          </Card>

          {/* Resumen de Maquinarias en Planta */}
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Cog className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Salud de Maquinarias de Tejeduría</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estado operativo de los telares y circulares en planta
                </p>
              </div>
              <NavLink
                to="/machines"
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Ver máquinas <ArrowUpRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                  {stats?.machines.operational ?? 0}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Operativas
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono block">
                  {stats?.machines.maintenance ?? 0}
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  Mantenimiento
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono block">
                  {stats?.machines.inactive ?? 0}
                </span>
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                  Inactivas
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Aprobaciones Pendientes y Usuarios / Seguridad (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bandeja de Aprobaciones Inmediatas */}
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  <span>Aprobaciones Pendientes</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rollos enviados por tejedores para visto bueno
                </p>
              </div>
              {pendingApprovals.length > 0 && (
                <Badge variant="amber" size="sm">
                  {pendingApprovals.length} pendientes
                </Badge>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Todo aprobado y al día
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No hay rollos esperando visto bueno en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {pendingApprovals.map((roll) => (
                  <div
                    key={roll.rollId}
                    className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-300">
                          Rollo #{roll.rollNumber}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {roll.batchNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {roll.supplierName} • {roll.weight ? `${roll.weight} kg` : 'Sin peso'}
                      </p>
                    </div>

                    {onApproveRoll && (
                      <button
                        type="button"
                        disabled={approvingRollId === roll.rollId}
                        onClick={() => onApproveRoll(roll.rollId, roll.rollNumber)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Aprobar rollo directamente"
                      >
                        {approvingRollId === roll.rollId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Aprobar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Usuarios por Rol */}
          {system && (
            <Card variant="glass" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Usuarios por Rol</span>
                </h3>
                <NavLink
                  to="/roles"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Ver roles <ArrowUpRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>

              <div className="space-y-3">
                {system.roleBreakdown.map((role) => {
                  const percentage =
                    system.totalUsers > 0
                      ? Math.round((role.count / system.totalUsers) * 100)
                      : 0;
                  return (
                    <div key={role.code}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        <span>{role.name}</span>
                        <span className="text-slate-400">
                          {role.count} usuario{role.count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Usuarios Recientes */}
          {system && (
            <Card variant="glass" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  Usuarios Recientes
                </h3>
                <NavLink
                  to="/users"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {system.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {getRoleDisplayName(user.role)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
