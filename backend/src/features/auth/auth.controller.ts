import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
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
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al autenticar usuario.';
      res.status(401).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
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
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al registrar usuario.';
      res.status(400).json({
        success: false,
        error: errorMsg,
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
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Token de refresco inválido o expirado.';
      res.status(401).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
        return;
      }

      const { firstName, lastName, email, avatarUrl } = req.body;
      const updatedUser = await authService.updateProfile(req.user.id, {
        firstName,
        lastName,
        email,
        avatarUrl,
      });

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente.',
        data: updatedUser,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al actualizar perfil.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'La contraseña actual y la nueva contraseña son requeridas.',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: 'La nueva contraseña debe tener al menos 6 caracteres.',
        });
        return;
      }

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada correctamente.',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cambiar contraseña.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }
}
