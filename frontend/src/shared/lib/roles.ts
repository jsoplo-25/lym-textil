import { rolesService } from '../../private-modules/roles/services/roles.service';
import type { RoleDefinition } from '../../private-modules/roles/types/roles.types';

// Dynamic cache of role definitions retrieved from the backend API
let cachedRoles: RoleDefinition[] = [];
let isFetchingRoles = false;

/**
 * Loads roles from the backend service and updates the in-memory cache.
 */
export async function refreshRolesCache(): Promise<RoleDefinition[]> {
  try {
    isFetchingRoles = true;
    const roles = await rolesService.getRoles();
    if (Array.isArray(roles)) {
      cachedRoles = roles;
    }
    return cachedRoles;
  } catch (err) {
    console.error('Error cargando roles desde el servicio:', err);
    return cachedRoles;
  } finally {
    isFetchingRoles = false;
  }
}

/**
 * Manually updates the cache when a role is created, edited or deleted in the UI.
 */
export function setCachedRoles(roles: RoleDefinition[]): void {
  cachedRoles = roles;
}

/**
 * Returns the currently cached roles list from the database.
 */
export function getCachedRoles(): RoleDefinition[] {
  // If cache is empty and not already fetching, fetch asynchronously
  if (cachedRoles.length === 0 && !isFetchingRoles && typeof window !== 'undefined') {
    refreshRolesCache().catch(() => {});
  }
  return cachedRoles;
}

/**
 * Returns a human-friendly descriptive name for a role code/id or UserProfile object.
 * Reads 100% from the database (via user.roleName, passed rolesList, or dynamically cached roles).
 */
export function getRoleDisplayName(
  roleOrUser?: string | { role?: string; roleName?: string } | null,
  rolesList?: Array<{ code: string; name: string }>
): string {
  if (!roleOrUser) return 'Sin Rol';

  // 1. If user object has the real roleName from the database, use it directly
  if (typeof roleOrUser === 'object') {
    if (roleOrUser.roleName) {
      return roleOrUser.roleName;
    }
    return getRoleDisplayName(roleOrUser.role, rolesList);
  }

  const roleCode = String(roleOrUser).trim();
  const normalized = roleCode.toUpperCase();

  // 2. Check in the provided roles list from service
  const listToSearch = rolesList && rolesList.length > 0 ? rolesList : getCachedRoles();
  if (listToSearch && listToSearch.length > 0) {
    const found = listToSearch.find(
      (r) => r.code.toUpperCase() === normalized || (r as any).id === roleCode
    );
    if (found && found.name) {
      return found.name;
    }
  }

  // 3. Fallback only if database is unreachable: cleanly capitalize the words from code
  return normalized
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
