import { Router } from 'express';
import { ProductionController } from './production.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/role.middleware';

const router = Router();
const controller = new ProductionController();

// Ruta PÚBLICA de seguimiento para proveedores (sin autenticación JWT)
router.get('/track/:code', controller.trackBatch);

// Lotes de producción (Batches)
router.get('/', authenticateJwt, requirePermission('production:read'), controller.getBatches);
router.get('/operators/list', authenticateJwt, requirePermission('production:read'), controller.getOperators);
router.get('/:id', authenticateJwt, requirePermission('production:read'), controller.getBatchById);
router.post('/', authenticateJwt, requirePermission('production:create'), controller.createBatch);
router.put('/:id', authenticateJwt, requirePermission('production:edit'), controller.updateBatch);
router.delete('/:id', authenticateJwt, requirePermission('production:delete'), controller.deleteBatch);

// Hilos dentro de un lote (Yarns)
router.post('/:id/yarns', authenticateJwt, requirePermission('production:create'), controller.addYarn);
router.put('/yarns/:yarnId', authenticateJwt, requirePermission('production:edit'), controller.updateYarn);
router.delete('/yarns/:yarnId', authenticateJwt, requirePermission('production:delete'), controller.deleteYarn);

// Rollos dentro de un lote (Rolls)
router.post('/:batchId/rolls', authenticateJwt, requirePermission('production:create'), controller.addRoll);
router.put('/rolls/:rollId', authenticateJwt, requirePermission('production:edit'), controller.updateRoll);
router.delete('/rolls/:rollId', authenticateJwt, requirePermission('production:delete'), controller.deleteRoll);

export default router;
