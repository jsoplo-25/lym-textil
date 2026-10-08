import { Router } from 'express';
import { MachinesController } from './machines.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';

const router = Router();
const controller = new MachinesController();

// Rutas protegidas por JWT y permisos de máquina
router.get('/', authenticateJwt, requirePermission('machines:read'), controller.getMachines);
router.get('/:id', authenticateJwt, requirePermission('machines:read'), controller.getMachineById);
router.post('/', authenticateJwt, requirePermission('machines:create'), controller.createMachine);
router.put('/:id', authenticateJwt, requirePermission('machines:edit'), controller.updateMachine);
router.delete('/:id', authenticateJwt, requirePermission('machines:delete'), controller.deleteMachine);

export default router;
