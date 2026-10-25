import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, ApiResponse } from '../../shared/types';
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from '../../shared/utils/cookies';
import { verifyToken } from '../../shared/utils/jwt';
import { sessionManager } from './session.manager';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, rememberMe = true } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email y contraseña son requeridos.',
        });
        return;
      }

      const result = await authService.login(email, password);

      // Attach secure httpOnly cookies
      setAuthCookies(
        res,
        {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken,
        },
        Boolean(rememberMe)
      );

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

      // Attach secure httpOnly cookies
      setAuthCookies(
        res,
        {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken,
        },
        true
      );

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
      // Prioritize request body or fallback to httpOnly cookie
      const tokenToRefresh =
        req.body?.refreshToken || req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

      if (!tokenToRefresh) {
        res.status(400).json({
          success: false,
          error: 'El refreshToken es requerido.',
        });
        return;
      }

      const result = await authService.refreshSession(tokenToRefresh);

      // Refresh the httpOnly cookies
      setAuthCookies(
        res,
        {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken,
        },
        true
      );

      res.status(200).json({
        success: true,
        message: 'Sesión renovada con éxito.',
        data: result,
      });
    } catch (error: unknown) {
      clearAuthCookies(res);
      const errorMsg = error instanceof Error ? error.message : 'Token de refresco inválido o expirado.';
      const isSuperseded = errorMsg.includes('SESSION_SUPERSEDED');
      const isExpired = errorMsg.includes('SESSION_EXPIRED');

      res.status(401).json({
        success: false,
        code: isSuperseded ? 'SESSION_SUPERSEDED' : isExpired ? 'SESSION_EXPIRED' : 'INVALID_REFRESH_TOKEN',
        error: errorMsg.replace(/^(SESSION_SUPERSEDED|SESSION_EXPIRED):\s*/, ''),
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      let token: string | null = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
      if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (token) {
        const decoded = verifyToken(token);
        if (decoded?.id) {
          sessionManager.endSession(decoded.id, decoded.sessionId);
        }
      }
    } catch {}

    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente.',
    });
  }

  /**
   * Chequeo rápido de sesión activa (usado por el frontend para detección de sesión única)
   */
  async checkSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado.' });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        active: true,
        userId: req.user.id,
        sessionId: req.user.sessionId,
      },
    });
  }

  /**
   * Stream Server-Sent Events (SSE) para desconexión en tiempo real ante concurrencia
   */
  async sessionStream(req: Request, res: Response): Promise<void> {
    let token: string | null = null;
    if (req.cookies && req.cookies[COOKIE_NAMES.ACCESS_TOKEN]) {
      token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    }
    if (!token && typeof req.query.token === 'string') {
      token = req.query.token;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).end();
      return;
    }

    try {
      const decoded = verifyToken(token);
      if (!decoded.sessionId) {
        res.status(400).end();
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      res.write(`: connected\n\n`);

      const unsubscribe = sessionManager.subscribe(decoded.id, decoded.sessionId, res);

      const pingInterval = setInterval(() => {
        try {
          res.write(`: ping\n\n`);
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);

      req.on('close', () => {
        clearInterval(pingInterval);
        unsubscribe();
      });
    } catch {
      res.status(401).end();
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
        return;
      }
      const freshUser = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: freshUser,
      });
    } catch {
      // Fallback defensivo a la información del token si la BD tiene micro-latencia
      res.status(200).json({
        success: true,
        data: req.user,
      });
    }
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

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'El correo electrónico es requerido.',
        });
        return;
      }

      await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: 'Si el correo electrónico está registrado, recibirás un código de verificación en breve.',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al procesar la solicitud de recuperación.';
      res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  async verifyResetCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({
          success: false,
          error: 'El correo y el código de verificación son requeridos.',
        });
        return;
      }

      const result = authService.verifyResetCode(email, code);
      if (!result.valid) {
        res.status(400).json({
          success: false,
          error: result.reason || 'El código de verificación es inválido o ha expirado.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Código de verificación válido.',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al verificar el código.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'El correo, el código y la nueva contraseña son requeridos.',
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

      await authService.resetPasswordWithCode(email, code, newPassword);

      res.status(200).json({
        success: true,
        message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión con tu nueva clave.',
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al restablecer la contraseña.';
      res.status(400).json({
        success: false,
        error: errorMsg,
      });
    }
  }
}
