"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
const controller = new users_controller_1.UsersController();
// Only ADMINISTRADOR and MANAGER roles can access user management
router.get('/', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requireRole)('ADMINISTRADOR', 'MANAGER'), controller.getUsers);
router.get('/:id', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requireRole)('ADMINISTRADOR', 'MANAGER'), controller.getUserById);
router.post('/', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requireRole)('ADMINISTRADOR'), controller.createUser);
router.put('/:id', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requireRole)('ADMINISTRADOR'), controller.updateUser);
router.delete('/:id', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requireRole)('ADMINISTRADOR'), controller.deleteUser);
exports.default = router;
