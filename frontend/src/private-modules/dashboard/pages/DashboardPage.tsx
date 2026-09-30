import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
  Users,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import type { RootState } from '../../../app/store';
import { Card } from '../../../shared/ui/Card';
import { Avatar } from '../../../shared/ui/Avatar';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useDashboard } from '../hooks/useDashboard';

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador General',
  MANAGER: 'Gerente',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operador',
  QUALITY_INSPECTOR: 'Inspector de Calidad',
  USER: 'Usuario',
};

const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const DashboardPage: React.FC = () => {
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const canViewSummary = sessionUser?.role === 'ADMINISTRADOR';
  const { data, isLoading, error } = useDashboard(canViewSummary);

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {!canViewSummary && (
        <Card variant="glass" padding="lg" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Bienvenido a Textil L&M</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Usa el menú lateral para acceder a los módulos habilitados para tu rol.
            </p>
          </div>
        </Card>
      )}

      {canViewSummary && (
        <>
          {error && (
            <Card variant="subtle" padding="md" className="text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card variant="glass" padding="lg" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {data?.totalUsers ?? 0}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Usuarios registrados
                </p>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/10 text-slate-700 dark:bg-white/10 dark:text-slate-200 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {data?.totalRoles ?? 0}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Roles configurados
                </p>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {data?.systemRoles ?? 0}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Roles nativos del sistema
                </p>
              </div>
            </Card>

            <Card variant="glass" padding="lg" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {data?.customRoles ?? 0}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Roles personalizados
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Role Breakdown */}
            <Card variant="glass" padding="lg" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 dark:text-white">Usuarios por Rol</h3>
                <NavLink
                  to="/roles"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Ver roles <ArrowUpRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>

              {!isLoading && (!data?.roleBreakdown.length) && (
                <p className="text-sm text-slate-400">Aún no hay roles registrados.</p>
              )}

              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))
                ) : data?.roleBreakdown.map((role) => {
                  const percentage = data.totalUsers > 0 ? Math.round((role.count / data.totalUsers) * 100) : 0;
                  return (
                    <div key={role.code}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        <span>{role.name}</span>
                        <span className="text-slate-400">{role.count} usuario{role.count === 1 ? '' : 's'}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Users */}
            <Card variant="glass" padding="lg" className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 dark:text-white">Usuarios Recientes</h3>
                <NavLink
                  to="/users"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>

              {!isLoading && (!data?.recentUsers.length) && (
                <p className="text-sm text-slate-400">Aún no hay usuarios registrados.</p>
              )}

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <div className="shrink-0 space-y-1.5">
                        <Skeleton className="h-4 w-16 rounded-full" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  ))
                ) : data?.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-1">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                      <p className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
