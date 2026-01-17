import { Router } from 'express';
import { monitoringService } from '../../services/monitoring.service.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/system', async (req, res, next) => {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
});

router.get('/containers', async (req, res, next) => {
  try {
    const stats = await monitoringService.getContainerStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const [system, containers] = await Promise.all([
      monitoringService.getSystemMetrics(),
      monitoringService.getContainerStats(),
    ]);
    res.json({ success: true, data: { system, containers } });
  } catch (error) {
    next(error);
  }
});

export default router;
