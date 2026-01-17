import { Router } from 'express';
import { 
  getAll, getSystemInfo, getImages, getNetworks, getVolumes, 
  getById, getStats, getLogs, start, stop, restart, 
  detectProjects, getAllPorts 
} from './containers.controller.js';
import {
  getProjectDetail, getProjectDatabases, getDatabaseTables, getDatabaseSize,
  queryDatabase, backupDatabase, restoreDatabase, listBackups, downloadBackup,
  deleteBackup, restartProject, stopProject, startProject
} from './projects.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Sistema
router.get('/', getAll);
router.get('/system', getSystemInfo);
router.get('/images', getImages);
router.get('/networks', getNetworks);
router.get('/volumes', getVolumes);
router.get('/detect-projects', detectProjects);
router.get('/ports', getAllPorts);

// Backups
router.get('/backups', listBackups);
router.get('/backups/:filename/download', downloadBackup);
router.delete('/backups/:filename', requireRole('admin'), deleteBackup);

// Proyectos detectados
router.get('/projects/:name', getProjectDetail);
router.get('/projects/:name/databases', getProjectDatabases);
router.post('/projects/:name/restart', requireRole('admin'), restartProject);
router.post('/projects/:name/stop', requireRole('admin'), stopProject);
router.post('/projects/:name/start', requireRole('admin'), startProject);

// Base de datos
router.get('/db/:containerId/tables', getDatabaseTables);
router.get('/db/:containerId/size', getDatabaseSize);
router.post('/db/:containerId/query', queryDatabase);
router.post('/db/:containerId/backup', requireRole('admin'), backupDatabase);
router.post('/db/:containerId/restore', requireRole('admin'), restoreDatabase);

// Contenedores individuales
router.get('/:id', getById);
router.get('/:id/stats', getStats);
router.get('/:id/logs', getLogs);
router.post('/:id/start', requireRole('admin'), start);
router.post('/:id/stop', requireRole('admin'), stop);
router.post('/:id/restart', requireRole('admin'), restart);

export default router;
