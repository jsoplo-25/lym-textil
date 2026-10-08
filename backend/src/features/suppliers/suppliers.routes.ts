import { Router } from 'express';
import { SuppliersController } from './suppliers.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';

const router = Router();
const controller = new SuppliersController();

// Permisos operacionales para la gestión de proveedores
router.get('/', authenticateJwt, requirePermission('suppliers:read'), controller.getSuppliers);
router.get('/:id', authenticateJwt, requirePermission('suppliers:read'), controller.getSupplierById);
router.post('/', authenticateJwt, requirePermission('suppliers:create'), controller.createSupplier);
router.put('/:id', authenticateJwt, requirePermission('suppliers:edit'), controller.updateSupplier);
router.delete('/:id', authenticateJwt, requirePermission('suppliers:delete'), controller.deleteSupplier);

export default router;
