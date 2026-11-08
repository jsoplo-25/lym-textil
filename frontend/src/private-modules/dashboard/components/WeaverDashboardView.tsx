import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Factory,
  Layers,
  Clock,
  CheckCircle2,
  PackageCheck,
  ArrowRight,
  Sparkles,
  Cog,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/dashboard.types';
import { DashboardStatCard } from './DashboardStatCard';
import { Card } from '../../../shared/ui/Card';
import { Badge } from '../../../shared/ui/Badge';
import { Skeleton } from '../../../shared/ui/Skeleton';

interface WeaverDashboardViewProps {
  data: DashboardMetrics | null;
  isLoading: boolean;
}

const getRollStatusBadge = (status?: string) => {
  switch (status) {
    case 'DELIVERED':
      return <Badge variant="emerald" size="sm">Entregado</Badge>;
    case 'READY_FOR_PICKUP':
      return <Badge variant="blue" size="sm">Listo para recojo</Badge>;
    case 'READY_FOR_APPROVAL':
      return <Badge variant="amber" size="sm">Esperando visto bueno</Badge>;
    case 'IN_PREPARATION':
      return <Badge variant="purple" size="sm">En preparación</Badge>;
    default:
      return <Badge variant="slate" size="sm">Registrado</Badge>;
  }
};

export const WeaverDashboardView: React.FC<WeaverDashboardViewProps> = ({
  data,
  isLoading,
}) => {
  const stats = data?.stats;
  const activeBatches = data?.activeBatches || [];
  const recentRolls = data?.recentRolls || [];

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardStatCard
          title="Lotes en Máquina"
          value={isLoading ? '-' : stats?.activeBatches ?? 0}
          subtitle="Órdenes activas para registrar tejido"
          icon={<Factory className="w-6 h-6" />}
          iconBg="bg-primary-500/15"
          iconColor="text-primary-600 dark:text-primary-400"
          badge={{ text: 'Activos', variant: 'emerald' }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Esperando Visto Bueno"
          value={isLoading ? '-' : stats?.rollsByStatus.readyForApproval ?? 0}
          subtitle="Rollos enviados a aprobación"
          icon={<Clock className="w-6 h-6" />}
          iconBg="bg-accent-500/15"
          iconColor="text-accent-600 dark:text-accent-400"
          badge={{
            text: `${stats?.rollsByStatus.readyForApproval ?? 0} por revisar`,
            variant: 'amber',
          }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Rollos para Entregar"
          value={isLoading ? '-' : stats?.rollsByStatus.readyForPickup ?? 0}
          subtitle="Aprobados para entrega al proveedor"
          icon={<PackageCheck className="w-6 h-6" />}
          iconBg="bg-blue-500/15"
          iconColor="text-blue-600 dark:text-blue-400"
          badge={{ text: 'Listos para recojo', variant: 'blue' }}
          isLoading={isLoading}
        />

        <DashboardStatCard
          title="Producción Acumulada"
          value={isLoading ? '-' : `${stats?.totalWeightKg.toLocaleString()} kg`}
          subtitle={`${stats?.totalRolls ?? 0} rollos registrados`}
          icon={<Layers className="w-6 h-6" />}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-600 dark:text-purple-400"
          badge={{ text: 'Planta', variant: 'purple' }}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna Izquierda: Lotes Activos para Tejer y Últimos Rollos (3 columnas) */}
        <div className="lg:col-span-3 space-y-6">
          <Card variant="solid" padding="md" className="rounded-xl shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>Mis Lotes en Producción</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona tu lote para registrar nuevos rollos pesados
                </p>
              </div>
              <NavLink
                to="/production"
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : activeBatches.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-primary-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No hay lotes en curso
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Cuando administración registre una orden de producción, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-primary-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1.5">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary-500/10 text-primary-700 dark:text-primary-300">
                          {batch.batchNumber}
                        </span>
                        {batch.machineName && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Cog className="w-3 h-3 text-slate-400" />
                            {batch.machineName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {batch.supplierName || 'Cliente General'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {batch.totalRolls} rollos • {batch.deliveredRolls} entregados
                      </p>
                    </div>

                    <div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2.5">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${batch.progressPercent}%` }}
                        />
                      </div>

                      <NavLink
                        to={`/production/${batch.id}`}
                        className="w-full py-2 px-3 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Abrir Sábana</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </NavLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Últimos Rollos Registrados en Vivo */}
          <Card variant="solid" padding="md" className="rounded-xl shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Últimos Rollos Registrados</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actividad reciente de pesaje y avance de rollos en planta
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : recentRolls.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aún no hay rollos registrados en el sistema.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentRolls.map((roll) => (
                  <div
                    key={roll.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          Rollo #{roll.rollNumber}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {roll.batchNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {roll.supplierName} • {roll.weight ? `${roll.weight} kg` : 'Sin peso'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right max-w-[45%]">
                      {getRollStatusBadge(roll.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Guía de Flujo y Máquinas (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guía Visual del Ciclo de Vida del Rollo */}
          <Card variant="solid" padding="md" className="rounded-xl shadow-none">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>Flujo de Trabajo del Tejedor</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Paso a paso para el registro y entrega de cada rollo
            </p>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              <div className="flex items-start gap-3 relative">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    1. En preparación
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Se registra el rollo al iniciar el tejido en la máquina.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-6 h-6 rounded-full bg-accent-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    2. Listo para aprobar
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Al terminar y pesar el rollo, lo pasas a visto bueno para que administración lo
                    apruebe.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    3. Listo para recojo
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Administración aprueba el rollo. Queda almacenado esperando el retiro.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 relative">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    4. Entregado
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cuando el cliente o chofer recoge el rollo, tú lo cambias a "Entregado".
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Estado de Máquinas */}
          <Card variant="solid" padding="md" className="rounded-xl shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Cog className="w-4 h-4 text-purple-500" />
                <span>Máquinas de Tejeduría</span>
              </h3>
              <Badge variant="purple" size="sm">
                {stats?.machines.total ?? 0} máquinas
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400 font-mono block">
                  {stats?.machines.operational ?? 0}
                </span>
                <span className="text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase">
                  Operativas
                </span>
              </div>
              <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                <span className="text-lg font-semibold text-accent-600 dark:text-accent-400 font-mono block">
                  {stats?.machines.maintenance ?? 0}
                </span>
                <span className="text-[10px] font-bold text-accent-700 dark:text-accent-300 uppercase">
                  Mantenimiento
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
