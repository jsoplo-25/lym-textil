"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = void 0;
const jwt_1 = require("../shared/utils/jwt");
const cookies_1 = require("../shared/utils/cookies");
const session_manager_1 = require("../features/auth/session.manager");
const authenticateJwt = (req, res, next) => {
    let token = null;
    // 1. Prioritize secure httpOnly cookie
    if (req.cookies && req.cookies[cookies_1.COOKIE_NAMES.ACCESS_TOKEN]) {
        token = req.cookies[cookies_1.COOKIE_NAMES.ACCESS_TOKEN];
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
        const decoded = (0, jwt_1.verifyToken)(token);
        // Validar que la sesión no haya sido reemplazada por otro login (en otra pestaña o en otra PC)
        if (decoded.sessionId && !session_manager_1.sessionManager.isValidSession(decoded.id, decoded.sessionId)) {
            res.status(401).json({
                success: false,
                code: 'SESSION_SUPERSEDED',
                error: 'Tu sesión ha sido iniciada en otro dispositivo o pestaña. La sesión actual se ha cerrado automáticamente.',
            });
            return;
        }
        session_manager_1.sessionManager.touchSession(decoded.id);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            error: 'Token inválido o expirado.',
        });
    }
};
exports.authenticateJwt = authenticateJwt;
