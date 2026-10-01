import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';

const router = Router();
const controller = new UsersController();

// Permisos operacionales para la gestión de usuarios
router.get('/', authenticateJwt, requirePermission('users:read'), controller.getUsers);
router.get('/:id', authenticateJwt, requirePermission('users:read'), controller.getUserById);
router.post('/', authenticateJwt, requirePermission('users:create'), controller.createUser);
router.put('/:id', authenticateJwt, requirePermission('users:edit'), controller.updateUser);
router.delete('/:id', authenticateJwt, requirePermission('users:delete'), controller.deleteUser);

export default router;
