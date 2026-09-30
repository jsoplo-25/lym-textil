import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../shared/types';

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
