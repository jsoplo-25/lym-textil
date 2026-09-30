import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();
const controller = new RolesController();

// Only ADMINISTRADOR and MANAGER roles can view roles
router.get('/', authenticateJwt, requireRole('ADMINISTRADOR', 'MANAGER'), controller.getRoles);
router.get('/:id', authenticateJwt, requireRole('ADMINISTRADOR', 'MANAGER'), controller.getRoleById);

// Only ADMINISTRADOR can create, update, or delete roles
router.post('/', authenticateJwt, requireRole('ADMINISTRADOR'), controller.createRole);
router.put('/:id', authenticateJwt, requireRole('ADMINISTRADOR'), controller.updateRole);
router.delete('/:id', authenticateJwt, requireRole('ADMINISTRADOR'), controller.deleteRole);

export default router;
