import { prisma } from '../config/prisma';

const INITIAL_SYSTEM_ROLES = [
  {
    code: 'ADMINISTRADOR',
    name: 'Administrador del Sistema',
    description: 'Acceso total y control de todos los módulos de la aplicación (Dashboard, Mi Perfil, Usuarios, Roles, Maquinarias, Proveedores y Producción).',
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
      'machines:read',
      'machines:create',
      'machines:edit',
      'machines:delete',
      'suppliers:read',
      'suppliers:create',
      'suppliers:edit',
      'suppliers:delete',
      'production:read',
      'production:create',
      'production:edit',
      'production:delete',
      'production:approve',
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
      } else if (role.code === 'ADMINISTRADOR') {
        // Ensure system administrator has all system permissions
        const missingPermissions = role.permissions.filter(p => !existing.permissions.includes(p));
        if (missingPermissions.length > 0) {
          const updatedPermissions = Array.from(new Set([...existing.permissions, ...role.permissions]));
          await prisma.roleDefinition.update({
            where: { code: role.code },
            data: { permissions: updatedPermissions },
          });
          console.log(`✅ [ROLES] Permisos de ${role.name} actualizados con: ${missingPermissions.join(', ')}`);
        }
      }
    }

    // Asegurar que el rol específico "Asistente Administrativo" cuente con permisos de aprobación y producción
    const assistantRoles = await prisma.roleDefinition.findMany({
      where: {
        OR: [
          { code: 'ASISTENTE_ADMINISTRATIVO' },
          { name: { equals: 'Asistente Administrativo', mode: 'insensitive' } },
        ],
      },
    });

    for (const aRole of assistantRoles) {
      const required = ['dashboard:view', 'profile:view', 'production:read', 'production:approve'];
      const missing = required.filter((p) => !aRole.permissions.includes(p));
      if (missing.length > 0) {
        await prisma.roleDefinition.update({
          where: { id: aRole.id },
          data: {
            permissions: Array.from(new Set([...aRole.permissions, ...required])),
          },
        });
        console.log(`✅ [ROLES] Permisos de Asistente Administrativo actualizados con: ${missing.join(', ')}`);
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('⚠️ [ROLES] Error al sincronizar roles en base de datos:', msg);
  }
}
