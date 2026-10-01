import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';

const router = Router();
const controller = new RolesController();

// Permisos operacionales para la gestión de roles y facultades
router.get('/', authenticateJwt, requirePermission('roles:read'), controller.getRoles);
router.get('/:id', authenticateJwt, requirePermission('roles:read'), controller.getRoleById);

router.post('/', authenticateJwt, requirePermission('roles:create'), controller.createRole);
router.put('/:id', authenticateJwt, requirePermission('roles:edit'), controller.updateRole);
router.delete('/:id', authenticateJwt, requirePermission('roles:delete'), controller.deleteRole);

export default router;
