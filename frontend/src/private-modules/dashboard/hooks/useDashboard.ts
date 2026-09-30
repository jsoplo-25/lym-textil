import { useState } from 'react';
import type { DashboardData } from '../types/dashboard.types';

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    data,
    isLoading,
    error,
    setData,
  };
};
