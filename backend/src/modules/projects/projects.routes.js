import { Router } from 'express';
import { getAll, getStats, getAllPorts, checkPort, getById, create, update, remove, addPort, removePort, addContainer, removeContainer } from './projects.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate, validateQuery } from '../../middleware/validator.js';
import { createProjectSchema, updateProjectSchema, addPortSchema, addContainerSchema, projectQuerySchema } from './projects.schema.js';

const router = Router();
router.use(authenticate);

router.get('/', validateQuery(projectQuerySchema), getAll);
router.get('/stats', getStats);
router.get('/ports', getAllPorts);
router.get('/ports/check/:port', checkPort);
router.get('/:id', getById);

router.post('/', requireRole('admin'), validate(createProjectSchema), create);
router.post('/:id/ports', requireRole('admin'), validate(addPortSchema), addPort);
router.post('/:id/containers', requireRole('admin'), validate(addContainerSchema), addContainer);

router.put('/:id', requireRole('admin'), validate(updateProjectSchema), update);

router.delete('/:id', requireRole('admin'), remove);
router.delete('/:id/ports/:portId', requireRole('admin'), removePort);
router.delete('/:id/containers/:containerId', requireRole('admin'), removeContainer);

export default router;
