"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
const controller = new users_controller_1.UsersController();
// Only ADMIN and MANAGER roles can access user management
router.get('/', auth_middleware_1.authenticateJwt, (0, role_middleware_1.requireRole)('ADMIN', 'MANAGER'), controller.getUsers);
exports.default = router;
