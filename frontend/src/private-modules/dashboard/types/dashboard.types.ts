import type { ManagedUser } from '../../users/types/users.types';

export interface RoleBreakdown {
  code: string;
  name: string;
  count: number;
  isSystem: boolean;
}

export interface DashboardSummary {
  totalUsers: number;
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
  roleBreakdown: RoleBreakdown[];
  recentUsers: ManagedUser[];
}
