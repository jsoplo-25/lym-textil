import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';
import { prisma, RoleDefinition } from '../../config/prisma';
import { supabaseAdmin } from '../../config/supabase';

export interface SystemRoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  badgeLabel: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

function mapPrismaRole(r: RoleDefinition): SystemRoleDefinition {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description || '',
    badgeLabel: r.code,
    permissions: r.permissions || [],
    isSystem: r.isSystem,
    createdAt: r.createdAt.toISOString(),
  };
}

export class RolesController {
  /**
   * Obtener todos los roles registrados en la base de datos
   */
  async getRoles(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dbRoles = await prisma.roleDefinition.findMany({
        orderBy: { createdAt: 'asc' },
      });

      const roles = dbRoles.map(mapPrismaRole);

      const response: ApiResponse<SystemRoleDefinition[]> = {
        success: true,
        data: roles,
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener roles.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Obtener un rol por su ID o por su código único
   */
  async getRoleById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const r = await prisma.roleDefinition.findFirst({
        where: {
          OR: [{ id }, { code: id.toUpperCase() }],
        },
      });

      if (!r) {
        res.status(404).json({ success: false, error: 'Rol no encontrado en la base de datos.' });
        return;
      }

      res.status(200).json({ success: true, data: mapPrismaRole(r) });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al obtener rol.';
      res.status(500).json({ success: false, error: errorMsg });
    }
  }

  /**
   * Crear un nuevo rol personalizado en la base de datos
   */
  async createRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { code, name, description, permissions } = req.body;

      if (!code || !name) {
        res.status(400).json({
          success: false,
          error: 'Código y nombre del rol son obligatorios.',
        });
        return;
      }

      const normalizedCode = String(code).toUpperCase().trim().replace(/\s+/g, '_');

      const existing = await prisma.roleDefinition.findUnique({
        where: { code: normalizedCode },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: `Ya existe un rol registrado con el código [${normalizedCode}].`,
        });
        return;
      }

      const dbRole = await prisma.roleDefinition.create({
        data: {
          code: normalizedCode,
          name: String(name).trim(),
          description: description ? String(description).trim() : '',
          permissions: Array.isArray(permissions) ? permissions : [],
          isSystem: false,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Rol creado exitosamente en la base de datos.',
        data: mapPrismaRole(dbRole),
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear rol.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Actualizar nombre, descripción y/o permisos de un rol existente
   */
  async updateRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { name, description, permissions } = req.body;

      const existing = await prisma.roleDefinition.findFirst({
        where: {
          OR: [{ id }, { code: id.toUpperCase() }],
        },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Rol no encontrado en la base de datos.' });
        return;
      }

      const updated = await prisma.roleDefinition.update({
        where: { id: existing.id },
        data: {
          ...(name && { name: String(name).trim() }),
          ...(description !== undefined && { description: String(description).trim() }),
          ...(Array.isArray(permissions) && { permissions }),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Permisos del rol actualizados exitosamente en la base de datos.',
        data: mapPrismaRole(updated),
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar rol.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  /**
   * Eliminar un rol de la base de datos
   */
  async deleteRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const existing = await prisma.roleDefinition.findFirst({
        where: {
          OR: [{ id }, { code: id.toUpperCase() }],
        },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Rol no encontrado en la base de datos.' });
        return;
      }

      // No permitir eliminar roles nativos del sistema
      if (existing.isSystem || existing.code === 'ADMINISTRADOR') {
        res.status(400).json({
          success: false,
          error: `El rol [${existing.name}] es un rol nativo del sistema y no puede ser eliminado.`,
        });
        return;
      }

      // No permitir que el usuario elimine su propio rol activo
      if (req.user && (req.user.role === existing.code || req.user.role === existing.id)) {
        res.status(400).json({
          success: false,
          error: `No puedes eliminar el rol [${existing.name}] porque lo tienes asignado a tu propia cuenta actual.`,
        });
        return;
      }

      // Validar si existen usuarios asignados a este rol antes de eliminarlo
      let usersCount = 0;
      try {
        usersCount = await prisma.user.count({
          where: {
            OR: [
              { role: existing.code as any },
              { role: existing.id as any },
            ],
          },
        });
      } catch {
        // Fallback defensivo con Supabase si Prisma en users falla
        try {
          const { count } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .or(`role.eq.${existing.code},role.eq.${existing.id}`);
          if (count && count > 0) {
            usersCount = count;
          }
        } catch {
          // Continuar con usersCount = 0 si falla la consulta opcional
        }
      }

      if (usersCount > 0) {
        res.status(400).json({
          success: false,
          error: `No se puede eliminar el rol [${existing.name}] porque tiene ${usersCount} usuario(s) asignado(s). Reasigna a los usuarios a otro rol antes de eliminarlo.`,
        });
        return;
      }

      await prisma.roleDefinition.delete({
        where: { id: existing.id },
      });

      res.status(200).json({
        success: true,
        message: `El rol [${existing.name}] ha sido eliminado exitosamente de la base de datos.`,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar rol.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }
}
