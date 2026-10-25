import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/types';
import { verifyToken } from '../shared/utils/jwt';
import { COOKIE_NAMES } from '../shared/utils/cookies';
import { sessionManager } from '../features/auth/session.manager';

export const authenticateJwt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | null = null;

  // 1. Prioritize secure httpOnly cookie
  if (req.cookies && req.cookies[COOKIE_NAMES.ACCESS_TOKEN]) {
    token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
  }

  // 2. Fallback to Authorization: Bearer header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Acceso no autorizado. Token de sesión requerido.',
    });
    return;
  }

  try {
    const decoded = verifyToken(token);

    // Validar que la sesión no haya sido reemplazada ni haya expirado por inactividad
    if (decoded.sessionId) {
      const validation = sessionManager.validateSession(decoded.id, decoded.sessionId);
      if (!validation.valid) {
        if (validation.reason === 'SUPERSEDED') {
          res.status(401).json({
            success: false,
            code: 'SESSION_SUPERSEDED',
            error: 'Tu sesión ha sido iniciada en otro dispositivo o pestaña. La sesión actual se ha cerrado automáticamente.',
          });
          return;
        } else {
          res.status(401).json({
            success: false,
            code: 'SESSION_EXPIRED',
            error: 'Tu sesión ha expirado por inactividad (15 minutos). Inicia sesión nuevamente.',
          });
          return;
        }
      }
    }

    sessionManager.touchSession(decoded.id);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado.',
    });
  }
};
