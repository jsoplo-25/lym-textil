import { prisma } from '../config/prisma';

export const INITIAL_SYSTEM_ROLES = [
  {
    code: 'ADMINISTRADOR',
    name: 'Administrador General',
    description: 'Acceso total y control de todos los módulos de la aplicación (Dashboard, Mi Perfil, Usuarios y Roles).',
    permissions: [
      'dashboard:view',
      'profile:view',
      'profile:edit',
      'users:read',
      'users:create',
      'users:edit',
      'users:delete',
      'roles:read',
      'roles:create',
      'roles:edit',
      'roles:delete',
    ],
    isSystem: true,
  },
  {
    code: 'OPERATOR',
    name: 'Operario Textil',
    description: 'Acceso operativo restringido exclusivamente al Dashboard y a la gestión de su Perfil personal.',
    permissions: [
      'dashboard:view',
      'profile:view',
      'profile:edit',
    ],
    isSystem: true,
  },
];

/**
 * Ensures system default roles exist in the database upon startup.
 * Keeps business data seeding separated from controllers and HTTP routers.
 */
export async function seedDefaultRoles(): Promise<void> {
  try {
    for (const role of INITIAL_SYSTEM_ROLES) {
      await prisma.roleDefinition.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
        },
        create: {
          code: role.code,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
        },
      });
    }
    console.log('✅ [ROLES] Roles sincronizados correctamente en la base de datos PostgreSQL.');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('⚠️ [ROLES] Error al sincronizar roles en base de datos:', msg);
  }
}
