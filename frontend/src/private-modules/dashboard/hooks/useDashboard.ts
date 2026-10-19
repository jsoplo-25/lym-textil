import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardMetrics } from '../types/dashboard.types';

export const useDashboard = (enabled: boolean = true) => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const metrics = await dashboardService.getMetrics();
      setData(metrics);
    } catch (err: unknown) {
      console.error('Error loading dashboard metrics:', err);
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiError || 'No se pudo cargar el resumen del panel.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      loadMetrics();
    } else {
      setIsLoading(false);
    }
  }, [enabled, loadMetrics]);

  // Auto-refresh when rolls are approved, updated or delivered elsewhere
  useEffect(() => {
    const handleUpdate = () => {
      if (enabled) {
        loadMetrics();
      }
    };

    window.addEventListener('production:rolls-updated', handleUpdate);
    return () => {
      window.removeEventListener('production:rolls-updated', handleUpdate);
    };
  }, [enabled, loadMetrics]);

  return { data, isLoading, error, reload: loadMetrics };
};
