import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardSummary } from '../types/dashboard.types';

export const useDashboard = (enabled: boolean = true) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await dashboardService.getSummary();
      setData(summary);
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
      setError('No se pudo cargar el resumen del panel.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      loadSummary();
    } else {
      setIsLoading(false);
    }
  }, [enabled, loadSummary]);

  return { data, isLoading, error, reload: loadSummary };
};
