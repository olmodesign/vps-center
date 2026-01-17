import { dockerService } from '../../services/docker.service.js';
import { databaseService } from '../../services/database.service.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

export const getProjectDetail = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const project = await dockerService.getProjectDetail(name);
  res.json({ success: true, data: project });
});

export const getProjectDatabases = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const project = await dockerService.getProjectDetail(name);
  res.json({ success: true, data: project.databases });
});

export const getDatabaseTables = asyncHandler(async (req, res) => {
  const { containerId } = req.params;
  const { database, user } = req.query;
  
  if (!database || !user) {
    return res.status(400).json({ success: false, message: 'database and user are required' });
  }
  
  const result = await databaseService.getPostgresTables(containerId, database, user);
  res.json({ success: true, data: result.tables });
});

export const getDatabaseSize = asyncHandler(async (req, res) => {
  const { containerId } = req.params;
  const { database, user } = req.query;
  
  if (!database || !user) {
    return res.status(400).json({ success: false, message: 'database and user are required' });
  }
  
  const result = await databaseService.getPostgresSize(containerId, database, user);
  res.json({ success: true, data: result });
});

export const queryDatabase = asyncHandler(async (req, res) => {
  const { containerId } = req.params;
  const { database, user, query } = req.body;
  
  if (!database || !user || !query) {
    return res.status(400).json({ success: false, message: 'database, user and query are required' });
  }
  
  const result = await databaseService.queryPostgres(containerId, database, user, query);
  res.json({ success: true, data: result });
});

export const backupDatabase = asyncHandler(async (req, res) => {
  const { containerId } = req.params;
  const { database, user } = req.body;
  
  if (!database || !user) {
    return res.status(400).json({ success: false, message: 'database and user are required' });
  }
  
  const result = await databaseService.backupPostgres(containerId, database, user);
  res.json({ success: true, data: result });
});

export const restoreDatabase = asyncHandler(async (req, res) => {
  const { containerId } = req.params;
  const { database, user, filename } = req.body;
  
  if (!database || !user || !filename) {
    return res.status(400).json({ success: false, message: 'database, user and filename are required' });
  }
  
  const backup = await databaseService.getBackupContent(filename);
  const result = await databaseService.restorePostgres(containerId, database, user, backup.path);
  res.json({ success: true, data: result });
});

export const listBackups = asyncHandler(async (req, res) => {
  const { project } = req.query;
  const backups = await databaseService.listBackups(project);
  res.json({ success: true, data: backups });
});

export const downloadBackup = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const backup = await databaseService.getBackupContent(filename);
  
  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
  res.setHeader('Content-Length', backup.size);
  res.send(backup.content);
});

export const deleteBackup = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  await databaseService.deleteBackup(filename);
  res.json({ success: true, message: 'Backup deleted' });
});

// Acciones masivas del proyecto
export const restartProject = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const project = await dockerService.getProjectDetail(name);
  
  const results = [];
  for (const container of project.containers) {
    try {
      await dockerService.restartContainer(container.id);
      results.push({ container: container.name, success: true });
    } catch (error) {
      results.push({ container: container.name, success: false, error: error.message });
    }
  }
  
  res.json({ success: true, data: results });
});

export const stopProject = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const project = await dockerService.getProjectDetail(name);
  
  const results = [];
  for (const container of project.containers) {
    try {
      await dockerService.stopContainer(container.id);
      results.push({ container: container.name, success: true });
    } catch (error) {
      results.push({ container: container.name, success: false, error: error.message });
    }
  }
  
  res.json({ success: true, data: results });
});

export const startProject = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const project = await dockerService.getProjectDetail(name);
  
  const results = [];
  for (const container of project.containers) {
    try {
      await dockerService.startContainer(container.id);
      results.push({ container: container.name, success: true });
    } catch (error) {
      results.push({ container: container.name, success: false, error: error.message });
    }
  }
  
  res.json({ success: true, data: results });
});
