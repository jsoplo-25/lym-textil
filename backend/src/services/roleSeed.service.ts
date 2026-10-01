import { prisma } from '../config/prisma';

export const INITIAL_SYSTEM_ROLES = [
  {
    code: 'ADMINISTRADOR',
    name: 'Administrador',
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
    name: 'Operario',
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
 * ONLY creates missing roles and NEVER overwrites user-customized names, descriptions, or permissions.
 */
export async function seedDefaultRoles(): Promise<void> {
  try {
    for (const role of INITIAL_SYSTEM_ROLES) {
      const existing = await prisma.roleDefinition.findUnique({
        where: { code: role.code },
      });

      // If the role does not exist at all, create it as default
      if (!existing) {
        await prisma.roleDefinition.create({
          data: {
            code: role.code,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystem: role.isSystem,
          },
        });
        console.log(`✅ [ROLES] Rol inicial creado: [${role.code}] -> ${role.name}`);
      }
      // If role already exists in database, DO NOT overwrite the user's modifications!
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('⚠️ [ROLES] Error al sincronizar roles en base de datos:', msg);
  }
}
