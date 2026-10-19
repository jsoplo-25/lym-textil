import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';

const router = Router();
const controller = new DashboardController();

// Ruta protegida por JWT y permiso de ver dashboard (todos los roles autenticados tienen dashboard:view)
router.get('/', authenticateJwt, requirePermission('dashboard:view'), controller.getMetrics);

export default router;
