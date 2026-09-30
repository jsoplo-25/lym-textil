import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../shared/types';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  const response: ApiResponse = {
    success: false,
    error: err.message || 'Error interno del servidor.',
  };

  res.status(err.status || 500).json(response);
};
