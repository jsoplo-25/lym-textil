import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../shared/types';
import { prisma } from '../config/prisma';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado.',
      });
      return;
    }

    const userRole = String(req.user.role).toUpperCase();
    const isAllowed = allowedRoles.some((r) => String(r).toUpperCase() === userRole);

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado.',
      });
      return;
    }

    const userRole = String(req.user.role).toUpperCase();
    // Administrador siempre tiene todas las facultades
    if (userRole === 'ADMINISTRADOR') {
      next();
      return;
    }

    let userPermissions = req.user.permissions || [];

    // Si los permisos no vienen en el payload, resolverlos dinámicamente de la base de datos
    if (!userPermissions || userPermissions.length === 0) {
      try {
        const roleDef = await prisma.roleDefinition.findFirst({
          where: {
            OR: [{ code: userRole }, { id: req.user.role }],
          },
        });
        if (roleDef && Array.isArray(roleDef.permissions)) {
          userPermissions = roleDef.permissions;
          req.user.permissions = userPermissions;
        }
      } catch {}
    }

    const hasAccess = requiredPermissions.some((p) => userPermissions.includes(p));

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: `Acceso denegado. Tu rol no cuenta con los permisos necesarios: [${requiredPermissions.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
