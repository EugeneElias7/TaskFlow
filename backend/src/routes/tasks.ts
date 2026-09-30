import { Router } from 'express';
import 'express-async-errors';
import { requireAuth } from '../middleware/auth';
import * as controller from '../controllers/taskController';

const router = Router();

// Every /api/tasks route requires a verified Firebase ID token.
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
