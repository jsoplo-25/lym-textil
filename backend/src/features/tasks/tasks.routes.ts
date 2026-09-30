import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new TasksController();

router.get('/', authenticateJwt, controller.getTasks);
router.post('/', authenticateJwt, controller.createTask);

export default router;
