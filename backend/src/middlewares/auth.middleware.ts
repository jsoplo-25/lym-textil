import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/types';
import { verifyToken } from '../shared/utils/jwt';

export const authenticateJwt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Acceso no autorizado. Token JWT requerido.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado.',
    });
  }
};
