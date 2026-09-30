"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async login(req, res, next) {
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
            const response = {
                success: true,
                message: 'Inicio de sesión exitoso.',
                data: result,
            };
            res.status(200).json(response);
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message || 'Error al autenticar usuario.',
            });
        }
    }
    async register(req, res, next) {
        try {
            const { email, password, fullName, role } = req.body;
            if (!email || !password || !fullName) {
                res.status(400).json({
                    success: false,
                    error: 'Email, contraseña y nombre completo son requeridos.',
                });
                return;
            }
            const result = await authService.register(email, password, fullName, role);
            const response = {
                success: true,
                message: 'Usuario registrado exitosamente.',
                data: result,
            };
            res.status(201).json(response);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Error al registrar usuario.',
            });
        }
    }
    async me(req, res) {
        res.status(200).json({
            success: true,
            data: req.user,
        });
    }
}
exports.AuthController = AuthController;
