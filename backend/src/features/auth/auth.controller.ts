import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email y contraseña son requeridos.',
        });
        return;
      }

      const result = await authService.login(email, password);

      const response: ApiResponse = {
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: result,
      };

      res.status(200).json(response);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Error al autenticar usuario.',
      });
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'Email, contraseña, nombre y apellido son requeridos.',
        });
        return;
      }

      const result = await authService.register(email, password, firstName, lastName, role);

      const response: ApiResponse = {
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: result,
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al registrar usuario.',
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'El refreshToken es requerido.',
        });
        return;
      }

      const result = await authService.refreshSession(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Sesión renovada con éxito.',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Token de refresco inválido o expirado.',
      });
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  }
}
