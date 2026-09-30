import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

const router = Router();
const controller = new UsersController();

// Only ADMIN and MANAGER roles can access user management
router.get('/', authenticateJwt, requireRole('ADMIN', 'MANAGER'), controller.getUsers);

export default router;
