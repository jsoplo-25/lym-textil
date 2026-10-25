"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
const controller = new users_controller_1.UsersController();
// Permisos operacionales para la gestión de usuarios
router.get('/', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requirePermission)('users:read'), controller.getUsers);
router.get('/:id', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requirePermission)('users:read'), controller.getUserById);
router.post('/', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requirePermission)('users:create'), controller.createUser);
router.put('/:id', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requirePermission)('users:edit'), controller.updateUser);
router.delete('/:id', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requirePermission)('users:delete'), controller.deleteUser);
exports.default = router;
