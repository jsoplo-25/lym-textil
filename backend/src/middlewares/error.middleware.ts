import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../shared/types';

export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  const status = err.status || err.statusCode || 500;
  const response: ApiResponse = {
    success: false,
    error: err.message || 'Error interno del servidor.',
  };

  res.status(status).json(response);
};
