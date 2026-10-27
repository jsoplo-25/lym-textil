import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireTurnstile } from '../../middlewares/turnstile.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', requireTurnstile, controller.login);
router.post('/register', controller.register);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-reset-code', controller.verifyResetCode);
router.post('/reset-password', controller.resetPassword);
router.get('/session-check', authenticateJwt, controller.checkSession);
router.get('/session-stream', controller.sessionStream);
router.get('/me', authenticateJwt, controller.me);
router.put('/profile', authenticateJwt, controller.updateProfile);
router.put('/change-password', authenticateJwt, controller.changePassword);

export default router;
