import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Factory, ArrowRight } from 'lucide-react';
import type { RootState } from '../../../app/store';
import { useDashboard } from '../hooks/useDashboard';
import { productionService } from '../../production/services/production.service';
import { useToast } from '../../../shared/hooks/useToast';
import { AdminDashboardView } from '../components/AdminDashboardView';
import { AssistantDashboardView } from '../components/AssistantDashboardView';
import { WeaverDashboardView } from '../components/WeaverDashboardView';
import { Card } from '../../../shared/ui/Card';

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

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full animate-fadeIn pb-12">
      {/* 1. Acceso rápido para rol de planta */}
      {isWeaver && (
        <div className="flex justify-end">
          <NavLink
            to="/production"
            className="px-3.5 py-1.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Ir a Sábana de Producción</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      )}

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
