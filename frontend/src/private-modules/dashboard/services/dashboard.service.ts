import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { DashboardMetrics } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Obtiene métricas y widgets del dashboard adaptados al rol en sesión
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await axiosInstance.get('/dashboard');
    return res.data.data;
  },
};
