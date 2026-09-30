export interface ProductionMetrics {
  totalOrders: number;
  completedMeters: number;
  activeOperators: number;
  qualityApprovalRate: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
}

export interface DashboardData {
  metrics: ProductionMetrics;
  recentActivities: RecentActivityItem[];
  systemStatus: string;
}
