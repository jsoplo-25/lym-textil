import { prisma } from '../src/config/prisma';
import process from 'node:process';

export const DEFAULT_ROLES = [
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
  }
];

export async function seedRoles() {
  console.log('🌱 Sembrando roles en la base de datos PostgreSQL...');
  for (const role of DEFAULT_ROLES) {
    const upserted = await prisma.roleDefinition.upsert({
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
    console.log(`✅ Rol [${upserted.code}] guardado exitosamente: ${upserted.name} con ${upserted.permissions?.length || 0} permisos.`);
  }
}

seedRoles()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e: unknown) => {
    console.error('❌ Error sembrando roles:', e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
