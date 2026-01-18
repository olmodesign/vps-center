import express from 'express';
import traefikController from './traefik.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', traefikController.getOverview.bind(traefikController));
router.get('/routers', traefikController.getRouters.bind(traefikController));
router.get('/services', traefikController.getServices.bind(traefikController));
router.get('/middlewares', traefikController.getMiddlewares.bind(traefikController));
router.get('/entrypoints', traefikController.getEntrypoints.bind(traefikController));
router.get('/certificates', traefikController.getCertificates.bind(traefikController));
router.get('/health', traefikController.healthCheck.bind(traefikController));

export default router;
