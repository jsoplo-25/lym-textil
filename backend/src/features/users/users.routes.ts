import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();
const controller = new UsersController();

// Only ADMINISTRADOR and MANAGER roles can access user management
router.get('/', authenticateJwt, requireRole('ADMINISTRADOR', 'MANAGER'), controller.getUsers);
router.get('/:id', authenticateJwt, requireRole('ADMINISTRADOR', 'MANAGER'), controller.getUserById);
router.post('/', authenticateJwt, requireRole('ADMINISTRADOR'), controller.createUser);
router.put('/:id', authenticateJwt, requireRole('ADMINISTRADOR'), controller.updateUser);
router.delete('/:id', authenticateJwt, requireRole('ADMINISTRADOR'), controller.deleteUser);

export default router;
