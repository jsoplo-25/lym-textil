"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
const prisma_1 = require("../config/prisma");
const requirePermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Usuario no autenticado.',
            });
            return;
        }
        const userRole = String(req.user.role).toUpperCase();
        const roleName = String(req.user.roleName || '').toUpperCase();
        // Administrador siempre tiene todas las facultades
        if (userRole === 'ADMINISTRADOR' || roleName === 'ADMINISTRADOR DEL SISTEMA') {
            next();
            return;
        }
        // Asistente Administrativo tiene facultad nativa de aprobar y consultar producción y dashboard
        const isAssistant = userRole === 'ASISTENTE_ADMINISTRATIVO' || roleName === 'ASISTENTE ADMINISTRATIVO';
        if (isAssistant &&
            requiredPermissions.every((p) => ['production:approve', 'production:read', 'dashboard:view', 'profile:view'].includes(p))) {
            next();
            return;
        }
        let userPermissions = req.user.permissions || [];
        // Si los permisos no vienen en el payload, resolverlos dinámicamente de la base de datos
        if (!userPermissions || userPermissions.length === 0) {
            try {
                const roleDef = await prisma_1.prisma.roleDefinition.findFirst({
                    where: {
                        OR: [{ code: userRole }, { id: req.user.role }],
                    },
                });
                if (roleDef && Array.isArray(roleDef.permissions)) {
                    userPermissions = roleDef.permissions;
                    req.user.permissions = userPermissions;
                }
            }
            catch { }
        }
        const hasAccess = requiredPermissions.some((p) => userPermissions.includes(p));
        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: `Acceso denegado. Tu rol no cuenta con los permisos necesarios: [${requiredPermissions.join(', ')}]`,
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
