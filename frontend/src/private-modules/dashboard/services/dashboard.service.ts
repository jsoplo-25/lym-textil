import { usersService } from '../../users/services/users.service';
import { rolesService } from '../../roles/services/roles.service';
import type { DashboardSummary, RoleBreakdown } from '../types/dashboard.types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const [users, roles] = await Promise.all([
      usersService.getUsers(),
      rolesService.getRoles(),
    ]);

    const roleBreakdown: RoleBreakdown[] = roles
      .map((role) => ({
        code: role.code,
        name: role.name,
        count: users.filter((user) => user.role === role.code).length,
        isSystem: role.isSystem,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUsers: users.length,
      totalRoles: roles.length,
      systemRoles: roles.filter((role) => role.isSystem).length,
      customRoles: roles.filter((role) => !role.isSystem).length,
      roleBreakdown,
      recentUsers: users.slice(0, 5),
    };
  },
};
