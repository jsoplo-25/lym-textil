import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { RefreshCw, Calendar, Factory, ArrowRight } from 'lucide-react';
import type { RootState } from '../../../app/store';
import { useDashboard } from '../hooks/useDashboard';
import { productionService } from '../../production/services/production.service';
import { useToast } from '../../../shared/hooks/useToast';
import { AdminDashboardView } from '../components/AdminDashboardView';
import { AssistantDashboardView } from '../components/AssistantDashboardView';
import { WeaverDashboardView } from '../components/WeaverDashboardView';
import { Card } from '../../../shared/ui/Card';
import { hasPermission } from '../../../shared/lib/roles';

export const DashboardPage: React.FC = () => {
  const sessionUser = useSelector((state: RootState) => state.session.user);
  const { data, isLoading, error, reload } = useDashboard(true);
  const toast = useToast();
  const [approvingRollId, setApprovingRollId] = useState<string | null>(null);

  // Aprobación directa de un rollo desde el dashboard
  const handleApproveRoll = async (rollId: string, rollNumber: string) => {
    try {
      setApprovingRollId(rollId);
      const res = await productionService.approveRoll(rollId);
      toast.success(res.message || `Rollo N° ${rollNumber} aprobado exitosamente.`);
      await reload();
      window.dispatchEvent(new CustomEvent('production:rolls-updated'));
    } catch (err: unknown) {
      console.error('Error al aprobar rollo desde dashboard:', err);
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(apiError || 'Error al aprobar el rollo.');
    } finally {
      setApprovingRollId(null);
    }
  };

  const roleCode = String(sessionUser?.role || 'OPERATOR').toUpperCase().trim();
  const roleName = String(sessionUser?.roleName || '').toUpperCase().trim();
  const canApprove = hasPermission(sessionUser, 'production:approve');

  // Determinación de la vista según el rol del usuario
  const isAdmin =
    roleCode === 'ADMINISTRADOR' ||
    roleName === 'ADMINISTRADOR DEL SISTEMA' ||
    roleName === 'ADMINISTRADOR' ||
    (Boolean(sessionUser?.permissions?.includes('users:read')) &&
      Boolean(sessionUser?.permissions?.includes('roles:read')));

  const isAssistant =
    !isAdmin &&
    (roleCode === 'ASISTENTE_ADMINISTRATIVO' ||
      roleName === 'ASISTENTE ADMINISTRATIVO');

  const isWeaver = !isAdmin && !isAssistant; // TEJEDOR, OPERATOR o rol de planta

  const todayFormatted = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {/* 1. Barra de herramientas y sincronización en tiempo real */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{capitalizedDate}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronizado en tiempo real</span>
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isWeaver && (
            <NavLink
              to="/production"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Ir a Sábana de Producción</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => reload()}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Actualizar datos del panel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
            <span>{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* 2. Error Banner si ocurre fallo en API */}
      {error && (
        <Card variant="subtle" padding="md" className="text-sm text-red-600 dark:text-red-400 font-medium">
          {error}
        </Card>
      )}

      {/* 3. Vistas Especializadas por Rol */}
      {isAdmin && (
        <AdminDashboardView
          data={data}
          isLoading={isLoading}
          onApproveRoll={handleApproveRoll}
          approvingRollId={approvingRollId}
        />
      )}

      {isAssistant && (
        <AssistantDashboardView
          data={data}
          isLoading={isLoading}
          onApproveRoll={handleApproveRoll}
          approvingRollId={approvingRollId}
        />
      )}

      {isWeaver && (
        <WeaverDashboardView
          data={data}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
