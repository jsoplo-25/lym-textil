"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const cookies_1 = require("../../shared/utils/cookies");
const authService = new auth_service_1.AuthService();
class AuthController {
    async login(req, res) {
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
            (0, cookies_1.setAuthCookies)(res, {
                accessToken: result.accessToken || result.token,
                refreshToken: result.refreshToken,
            }, Boolean(rememberMe));
            const response = {
                success: true,
                message: 'Inicio de sesión exitoso.',
                data: result,
            };
            res.status(200).json(response);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al autenticar usuario.';
            res.status(401).json({
                success: false,
                error: errorMsg,
            });
        }
    }
    async register(req, res) {
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
            (0, cookies_1.setAuthCookies)(res, {
                accessToken: result.accessToken || result.token,
                refreshToken: result.refreshToken,
            }, true);
            const response = {
                success: true,
                message: 'Usuario registrado exitosamente.',
                data: result,
            };
            res.status(201).json(response);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al registrar usuario.';
            res.status(400).json({
                success: false,
                error: errorMsg,
            });
        }
    }
    async refresh(req, res) {
        try {
            // Prioritize request body or fallback to httpOnly cookie
            const tokenToRefresh = req.body?.refreshToken || req.cookies?.[cookies_1.COOKIE_NAMES.REFRESH_TOKEN];
            if (!tokenToRefresh) {
                res.status(400).json({
                    success: false,
                    error: 'El refreshToken es requerido.',
                });
                return;
            }
            const result = await authService.refreshSession(tokenToRefresh);
            // Refresh the httpOnly cookies
            (0, cookies_1.setAuthCookies)(res, {
                accessToken: result.accessToken || result.token,
                refreshToken: result.refreshToken,
            }, true);
            res.status(200).json({
                success: true,
                message: 'Sesión renovada con éxito.',
                data: result,
            });
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Token de refresco inválido o expirado.';
            res.status(401).json({
                success: false,
                error: errorMsg,
            });
        }
    }
    async logout(_req, res) {
        (0, cookies_1.clearAuthCookies)(res);
        res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente.',
        });
    }
    async me(req, res) {
        res.status(200).json({
            success: true,
            data: req.user,
        });
    }
    async updateProfile(req, res) {
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
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al actualizar perfil.';
            res.status(400).json({
                success: false,
                error: errorMsg,
            });
        }
    }
    async changePassword(req, res) {
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
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Error al cambiar contraseña.';
            res.status(400).json({
                success: false,
                error: errorMsg,
            });
        }
    }
}
exports.AuthController = AuthController;
