import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/refresh', controller.refresh);
router.get('/me', authenticateJwt, controller.me);

export default router;
